
DROP POLICY IF EXISTS "Ambulance users can update their records" ON public.ambulance_history;

CREATE POLICY "Authenticated users can update ambulance history"
ON public.ambulance_history
FOR UPDATE
TO authenticated
USING (
  ambulance_user_id IS NULL OR auth.uid() = ambulance_user_id
)
WITH CHECK (true);
