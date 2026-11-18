-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, phone)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      split_part(COALESCE(NEW.email, ''), '@', 1)
    ),
    NULLIF(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Listings
CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  mode text NOT NULL CHECK (mode IN ('goods', 'jobs')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  category text NOT NULL,
  city text NOT NULL,
  price bigint CHECK (price IS NULL OR price >= 0),
  price_max bigint CHECK (price_max IS NULL OR price_max >= 0),
  price_from boolean NOT NULL DEFAULT false,
  price_suffix text,
  description text NOT NULL CHECK (char_length(description) <= 5000),
  images text[] NOT NULL DEFAULT '{}',
  phone text NOT NULL,
  telegram text,
  company text,
  schedule text,
  seller_name text NOT NULL,
  seller_type text NOT NULL DEFAULT 'Частное лицо',
  seller_since text,
  seller_rating numeric(2,1),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX listings_mode_created_idx ON public.listings (mode, created_at DESC);
CREATE INDEX listings_user_idx ON public.listings (user_id);
GRANT SELECT ON public.listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view listings" ON public.listings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users create own listings" ON public.listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own listings" ON public.listings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own listings" ON public.listings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Favorites
CREATE TABLE public.favorites (
  user_id uuid NOT NULL,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own favorites" ON public.favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users add own favorites" ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own favorites" ON public.favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Ad photos (private bucket, readable via signed links)
CREATE POLICY "Anyone can view listing photos" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'listing-images');
CREATE POLICY "Users upload own listing photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own listing photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Demo listings
INSERT INTO public.listings (mode, title, category, city, price, price_max, price_from, price_suffix, description, images, phone, telegram, company, schedule, seller_name, seller_type, seller_since, seller_rating, created_at) VALUES
('goods', 'iPhone 14 Pro 256 ГБ, фиолетовый', 'Электроника', 'Алматы', 420000, NULL, false, NULL,
 'Продаю iPhone 14 Pro в идеальном состоянии. Пользовался аккуратно, всегда в чехле и с защитным стеклом. Аккумулятор 89%. Полный комплект: коробка, кабель, документы. Не ремонтировался, Face ID работает. Возможен обмен с моей доплатой на 15 Pro.',
 ARRAY['demo/iphone.jpg'], '+7 701 234 56 78', 'alibek_kz', NULL, NULL, 'Алибек', 'Частное лицо', 'на Сауда с 2021 года', 4.9, now() - interval '90 minutes'),
('goods', '2-комнатная квартира в аренду, ЖК «Хайвил», 64 м²', 'Недвижимость', 'Астана', 280000, NULL, false, '/ мес',
 'Сдается светлая двухкомнатная квартира на долгий срок. Левый берег, 7 этаж из 12. Есть вся мебель и техника: холодильник, стиральная машина, посудомойка, Wi‑Fi. Рядом школа, детский сад и Mega Silk Way. Без животных. Оплата + коммунальные услуги по счетчикам.',
 ARRAY['demo/apartment.jpg'], '+7 707 555 12 34', 'aigerim_home', NULL, NULL, 'Айгерим', 'Собственник', 'на Сауда с 2019 года', 5.0, now() - interval '4 hours'),
('goods', 'Ремонт квартир под ключ — бригада с опытом', 'Услуги', 'Караганда', 15000, NULL, true, 'за м²',
 'Выполняем ремонт квартир и домов под ключ: демонтаж, штукатурка, шпаклевка, покраска, ламинат, плитка, сантехника и электрика. Работаем по договору, даем гарантию 2 года. Бесплатный выезд замерщика и смета в день обращения. Фото работ отправим в WhatsApp.',
 ARRAY['demo/renovation.jpg'], '+7 776 300 40 50', NULL, NULL, NULL, 'Строй-Мастер', 'Компания', 'на Сауда с 2018 года', 4.8, now() - interval '9 hours'),
('goods', 'Сборники для подготовки к ЕНТ и учебники 10–11 класс', 'Учеба и книги', 'Шымкент', 12000, NULL, false, NULL,
 'Отдаю комплектом 7 книг: математика, физика, английский язык, сборники тестов. Состояние хорошее, есть пометки карандашом. Помогли сыну набрать 118 баллов. Можно забрать в районе Самал или отправлю почтой.',
 ARRAY['demo/books.jpg'], '+7 705 111 22 33', 'gulnara_shym', NULL, NULL, 'Гульнара', 'Частное лицо', 'на Сауда с 2022 года', NULL, now() - interval '26 hours'),
('goods', 'MacBook Air 13 M1, 8/256 ГБ, серебристый', 'Электроника', 'Караганда', 350000, NULL, false, NULL,
 'Ноутбук в отличном состоянии, 120 циклов зарядки. Никаких царапин на корпусе и экране. Отлично подходит для учебы и работы. В комплекте оригинальная зарядка. Проверка на месте, торг уместен.',
 ARRAY['demo/laptop.jpg'], '+7 700 987 65 43', 'daniil_krg', NULL, NULL, 'Даниил', 'Частное лицо', 'на Сауда с 2020 года', 4.7, now() - interval '31 hours'),
('goods', 'Горный велосипед, рама 19", 27.5"', 'Спорт и хобби', 'Алматы', 145000, NULL, false, NULL,
 'Хардтейл, гидравлические дисковые тормоза, вилка с блокировкой, 27 скоростей. Обслужен этой весной: новая цепь и покрышки. Катался по Медеу и Кок-Жайляу. Продаю в связи с переездом.',
 ARRAY['demo/bike.jpg'], '+7 747 222 33 44', NULL, NULL, NULL, 'Ерлан', 'Частное лицо', 'на Сауда с 2023 года', NULL, now() - interval '52 hours'),
('jobs', 'Курьер на велосипеде или самокате', 'Подработка', 'Алматы', 250000, 400000, false, '/ мес',
 'Ищем курьеров для доставки заказов из ресторанов и магазинов. Выбирайте удобные слоты сами. Выплаты каждую неделю на карту Kaspi. Термосумку выдаем бесплатно. Подходит студентам — можно совмещать с учебой.',
 '{}', '+7 727 350 00 00', 'zhyldam_hr', 'Доставка «Жылдам»', 'Свободный график, от 4 часов', 'Доставка «Жылдам»', 'Работодатель', 'на Сауда с 2020 года', 4.6, now() - interval '40 minutes'),
('jobs', 'Бариста в кофейню в центре города', 'Полный день', 'Астана', 220000, 300000, false, '/ мес',
 'Приглашаем бариста в уютную кофейню на Достык. Опыт приветствуется, но обучим с нуля. Бесплатные обеды, униформа, чаевые остаются вам. Официальное трудоустройство после испытательного срока.',
 '{}', '+7 717 244 10 10', 'coffeepoint_kz', 'Coffee Point', 'Сменный график 2/2, 8:00–20:00', 'Coffee Point', 'Работодатель', 'на Сауда с 2022 года', 4.8, now() - interval '3 hours'),
('jobs', 'Frontend-разработчик (React, TypeScript)', 'Удаленка', 'Алматы', 900000, 1300000, false, '/ мес',
 'Ищем разработчика в команду продукта с аудиторией 5 млн пользователей. Требования: опыт от 2 лет, React, TypeScript, понимание принципов доступности. Предлагаем: удаленку из любого города Казахстана, ДМС, компенсацию обучения и техники.',
 '{}', '+7 727 390 20 20', 'kolesa_hr', 'Kolesa Tech', 'Полная удаленка, 5/2', 'Kolesa Tech', 'Работодатель', 'на Сауда с 2017 года', 4.9, now() - interval '7 hours'),
('jobs', 'Стажер в отдел маркетинга', 'Стажировка', 'Караганда', 150000, NULL, false, '/ мес',
 'Стажировка для студентов 3–4 курса и выпускников. Будете помогать вести соцсети, готовить контент и анализировать рекламные кампании. Наставник, сертификат по итогам и возможность остаться в штате.',
 '{}', '+7 721 250 30 30', NULL, 'Qarmet Digital', 'Гибкий график, 20–30 часов в неделю', 'Qarmet Digital', 'Работодатель', 'на Сауда с 2021 года', NULL, now() - interval '20 hours'),
('jobs', 'Промоутер на выходные в ТРЦ', 'Подработка', 'Шымкент', 8000, NULL, false, '/ день',
 'Раздача листовок и консультация покупателей в ТРЦ. Оплата в конце каждого дня. Возраст от 16 лет. Главное — общительность и пунктуальность. Можно работать вместе с друзьями.',
 '{}', '+7 725 260 40 40', 'promogroup_shym', 'Promo Group', 'Суббота и воскресенье, 11:00–17:00', 'Promo Group', 'Работодатель', 'на Сауда с 2023 года', NULL, now() - interval '28 hours'),
('jobs', 'Оператор колл-центра (удаленно, рус/каз)', 'Удаленка', 'Астана', 280000, NULL, false, '/ мес',
 'Принимаем входящие обращения клиентов из дома. Нужен ноутбук, наушники с микрофоном и стабильный интернет. Знание русского и казахского языков. Оплачиваемое обучение 1 неделю, бонусы за качество.',
 '{}', '+7 717 255 50 50', NULL, 'Freedom Service', '5/2 или 2/2, можно частичная занятость', 'Freedom Service', 'Работодатель', 'на Сауда с 2020 года', 4.5, now() - interval '45 hours');