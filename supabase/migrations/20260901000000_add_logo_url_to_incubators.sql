-- Add logo_url to incubators, enabling org/company logos on the
-- Incubators & Accelerators directory (public.businesses already had this).
alter table public.incubators add column logo_url text;
