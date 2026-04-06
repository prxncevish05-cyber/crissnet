
-- Drop and recreate with explicit auth check
DROP POLICY "Authenticated users can insert ambulance history" ON public.ambulance_history;
CREATE POLICY "Authenticated users can insert ambulance history" ON public.ambulance_history FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
