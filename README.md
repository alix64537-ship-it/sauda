# Городская Доска

Create a modern classifieds and job board web application (similar to OLX) with a clean, trustworthy UI in Russian language. 



Core Features & Structure for the MVP:

1. Header & Navigation:

   - App logo on the left.

   - Main mode switcher tabs: "Объявления" (Goods & Services) and "Работа и подработка" (Jobs & Gigs).

   - City selector dropdown (default: "Все города", with options like Караганда, Астана, Алматы, Шымкент).

   - "Подать объявление" (Post an Ad) primary CTA button and a "Войти" (Login) / Profile button.



2. Search & Filters Section:

   - Prominent search bar with keyword input and search button.

   - Category pills/icons (e.g., Электроника, Услуги, Учеба и книги, Недвижимость for Goods; Подработка, Полный день, Удаленка, Стажировка for Jobs).

   - Sidebar or horizontal filter bar: Price/Salary range (От / До in ₸), Sort by (Новые, Дешевле, Дороже).



3. Listings Feed (Grid View):

   - Responsive 4-column grid on desktop, 2-column on mobile.

   - Listing Card design: Image placeholder (or clean icon badge for jobs), Title, Price or Salary (formatted in ₸), City, Date posted, and a Heart icon (Add to Favorites).

   - Populate with 12 realistic Russian mock listings (6 goods/services, 6 jobs/part-time gigs) so the feed looks alive immediately.



4. Listing Details Modal / Page:

   - Clicking a card opens a detailed view with full description, image gallery, seller/employer info card, and a "Написать / Показать телефон" button (with a mock reveal or Telegram/WhatsApp link).



5. Post an Ad Modal / Page:

   - Clean form allowing users to switch between "Товар/Услуга" and "Вакансия", enter title, category, city, price/salary, description, contact info (phone/Telegram), and an image upload dropzone. Submitting adds the item to the local state for now.



Design Style:

- Modern, clean marketplace aesthetic with crisp white cards, subtle borders, light gray background (#F8FAFC), and a strong primary accent color (e.g., emerald green or deep teal).

- Ensure all UI labels, placeholders, buttons, and mock data are in natural Russian.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/075cb423-80ed-476f-bd54-39e4a654db7c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
