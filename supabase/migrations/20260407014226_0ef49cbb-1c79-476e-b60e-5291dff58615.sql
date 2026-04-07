
ALTER TABLE public.ambulance_history ADD COLUMN IF NOT EXISTS patient_user_id uuid;

ALTER PUBLICATION supabase_realtime ADD TABLE public.ambulance_history;
