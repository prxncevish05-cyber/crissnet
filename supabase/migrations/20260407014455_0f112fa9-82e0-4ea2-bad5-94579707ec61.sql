
DROP POLICY IF EXISTS "Authenticated users can update ambulance history" ON public.ambulance_history;

CREATE POLICY "Ambulance users can update requests"
ON public.ambulance_history
FOR UPDATE
TO authenticated
USING (
  ambulance_user_id IS NULL OR auth.uid() = ambulance_user_id
)
WITH CHECK (
  auth.uid() IS NOT NULL
);
