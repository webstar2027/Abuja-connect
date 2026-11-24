-- Abuja Connect: payment integration fields and subscription access policies.
-- Review the existing policies before running in the connected Supabase project.
-- Only paid members can discover other profiles; users can still read their own profile while unpaid.
DROP POLICY IF EXISTS "profiles readable by authenticated members" ON public.profiles;
CREATE POLICY "paid members read profiles plus own profile" ON public.profiles
FOR SELECT TO authenticated USING (is_banned = false AND (id = auth.uid() OR public.is_active_subscriber(auth.uid())));

DROP POLICY IF EXISTS "members read likes involving them" ON public.likes;
CREATE POLICY "active subscribers read likes involving them" ON public.likes
FOR SELECT TO authenticated USING (public.is_active_subscriber(auth.uid()) AND (from_user = auth.uid() OR to_user = auth.uid()));
DROP POLICY IF EXISTS "members like from own account" ON public.likes;
CREATE POLICY "active subscribers like from own account" ON public.likes
FOR INSERT TO authenticated WITH CHECK (public.is_active_subscriber(auth.uid()) AND from_user = auth.uid() AND to_user <> auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = to_user AND p.is_banned = false));
DROP POLICY IF EXISTS "members update own like" ON public.likes;
CREATE POLICY "active subscribers update own like" ON public.likes
FOR UPDATE TO authenticated USING (public.is_active_subscriber(auth.uid()) AND from_user = auth.uid())
WITH CHECK (public.is_active_subscriber(auth.uid()) AND from_user = auth.uid());

DROP POLICY IF EXISTS "members read own matches" ON public.matches;
CREATE POLICY "active subscribers read own matches" ON public.matches
FOR SELECT TO authenticated USING (public.is_active_subscriber(auth.uid()) AND (user_one = auth.uid() OR user_two = auth.uid()));

DROP POLICY IF EXISTS "matched members read messages" ON public.messages;
DROP POLICY IF EXISTS "members read messages" ON public.messages;
DROP POLICY IF EXISTS "matched members read own messages" ON public.messages;
DROP POLICY IF EXISTS "active subscribers read matched messages" ON public.messages;
CREATE POLICY "active subscribers read matched messages" ON public.messages
FOR SELECT TO authenticated USING ((sender_id = auth.uid() OR recipient_id = auth.uid()) AND public.is_match_member(match_id, auth.uid()) AND public.is_active_subscriber(auth.uid()));

-- Remove previously used permissive insert policy names before restoring the paid-only policy.
DROP POLICY IF EXISTS "Match participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "match participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "matched members can send messages" ON public.messages;
DROP POLICY IF EXISTS "active subscribers can send to a match" ON public.messages;
CREATE POLICY "active subscribers can send to a match" ON public.messages
FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid()
  AND public.is_active_subscriber(auth.uid())
  AND public.is_match_between(match_id, sender_id, recipient_id)
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = recipient_id AND p.is_banned = false)
);

-- Mutual matches are created only when both members currently have paid access.
CREATE OR REPLACE FUNCTION public.create_mutual_match()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE lo uuid; hi uuid;
BEGIN
  IF public.is_active_subscriber(new.from_user) AND public.is_active_subscriber(new.to_user)
     AND EXISTS (SELECT 1 FROM public.likes WHERE from_user = new.to_user AND to_user = new.from_user) THEN
    lo := least(new.from_user, new.to_user); hi := greatest(new.from_user, new.to_user);
    INSERT INTO public.matches(user_one, user_two) VALUES(lo, hi) ON CONFLICT(user_one, user_two) DO NOTHING;
  END IF;
  RETURN new;
END;
$$;

-- Do not add any client-side INSERT/UPDATE/DELETE policies for subscriptions.
-- The Node backend uses the Supabase service-role key only after Paystack verification.
