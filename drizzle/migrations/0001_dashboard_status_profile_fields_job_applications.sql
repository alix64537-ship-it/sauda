-- Listing status: active listings are public, archived (sold / closed) are visible only to their owner
ALTER TABLE public.listings ADD COLUMN status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived'));
CREATE INDEX listings_status_mode_created_idx ON public.listings (status, mode, created_at DESC);
DROP POLICY "Anyone can view listings" ON public.listings;
CREATE POLICY "Anyone can view active listings" ON public.listings FOR SELECT TO anon, authenticated USING (status = 'active');
CREATE POLICY "Owners view own listings" ON public.listings FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Extra profile settings
ALTER TABLE public.profiles ADD COLUMN telegram text CHECK (telegram IS NULL OR telegram ~ '^[A-Za-z0-9_]{5,32}$');
ALTER TABLE public.profiles ADD COLUMN city text CHECK (city IS NULL OR char_length(city) <= 60);

-- Job applications
CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL,
  applicant_name text NOT NULL CHECK (char_length(btrim(applicant_name)) BETWEEN 2 AND 80),
  contact_info text NOT NULL CHECK (char_length(btrim(contact_info)) BETWEEN 3 AND 100),
  message text NOT NULL DEFAULT '' CHECK (char_length(message) <= 1500),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, applicant_id)
);
CREATE INDEX job_applications_listing_idx ON public.job_applications (listing_id, created_at DESC);
CREATE INDEX job_applications_applicant_idx ON public.job_applications (applicant_id);
GRANT SELECT, INSERT ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Applicants apply to open vacancies" ON public.job_applications FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = applicant_id
    AND EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND l.mode = 'jobs'
        AND l.status = 'active'
        AND (l.user_id IS NULL OR l.user_id <> auth.uid())
    )
  );
CREATE POLICY "Applicants read own applications" ON public.job_applications FOR SELECT TO authenticated
  USING (auth.uid() = applicant_id);
CREATE POLICY "Employers read applications to own vacancies" ON public.job_applications FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.user_id = auth.uid()));
