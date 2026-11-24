-- Abuja Connect: enable core social features for all authenticated members.
-- Additive migration. Does not delete users, profiles, likes, matches, messages, or subscriptions.
-- Run after paystack-subscription-gates.sql if that file was previously applied.

-- Profile discovery no longer requires an active subscription.
DROP POLICY IF EXISTS "paid members read profiles plus own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles readable by authenticated members" ON public.profiles;
CREATE POLICY "profiles readable by authenticated members" ON public.profiles
FOR SELECT TO authenticated USING (is_banned = false);


-- Likes and matches are free core features.
DROP POLICY IF EXISTS "active subscribers read likes involving them" ON public.likes;
DROP POLICY IF EXISTS "members read likes involving them" ON public.likes;
CREATE POLICY "members read likes involving them" ON public.likes
FOR SELECT TO authenticated USING (from_user = auth.uid() OR to_user = auth.uid());

DROP POLICY IF EXISTS "active subscribers like from own account" ON public.likes;
DROP POLICY IF EXISTS "members like from own account" ON public.likes;
CREATE POLICY "members like from own account" ON public.likes
FOR INSERT TO authenticated WITH CHECK (
  from_user = auth.uid() AND to_user <> auth.uid()
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = to_user AND p.is_banned = false)
);
DROP POLICY IF EXISTS "active subscribers update own like" ON public.likes;
DROP POLICY IF EXISTS "members update own like" ON public.likes;
CREATE POLICY "members update own like" ON public.likes
FOR UPDATE TO authenticated USING (from_user = auth.uid()) WITH CHECK (from_user = auth.uid());

DROP POLICY IF EXISTS "active subscribers read own matches" ON public.matches;
DROP POLICY IF EXISTS "members read own matches" ON public.matches;
CREATE POLICY "members read own matches" ON public.matches
FOR SELECT TO authenticated USING (user_one = auth.uid() OR user_two = auth.uid());

-- Free messaging remains limited to mutual-match participants in this release.
DROP POLICY IF EXISTS "active subscribers read matched messages" ON public.messages;
DROP POLICY IF EXISTS "matched members read messages" ON public.messages;
DROP POLICY IF EXISTS "members read messages" ON public.messages;
CREATE POLICY "matched members read messages" ON public.messages
FOR SELECT TO authenticated USING (
  (sender_id = auth.uid() OR recipient_id = auth.uid())
  AND public.is_match_member(match_id, auth.uid())
);
DROP POLICY IF EXISTS "active subscribers can send to a match" ON public.messages;
DROP POLICY IF EXISTS "Match participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "match participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "matched members can send messages" ON public.messages;
CREATE POLICY "matched members can send messages" ON public.messages
FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid()
  AND public.is_match_between(match_id, sender_id, recipient_id)
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = recipient_id AND p.is_banned = false)
);

-- Mutual matches are created for free members when both like each other.
CREATE OR REPLACE FUNCTION public.create_mutual_match()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE lo uuid; hi uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.likes WHERE from_user = new.to_user AND to_user = new.from_user) THEN
    lo := least(new.from_user, new.to_user); hi := greatest(new.from_user, new.to_user);
    INSERT INTO public.matches(user_one, user_two) VALUES(lo, hi)
    ON CONFLICT(user_one, user_two) DO NOTHING;
  END IF;
  RETURN new;
END;
$$;

GRANT SELECT, INSERT, UPDATE ON public.likes TO authenticated;
GRANT SELECT ON public.matches TO authenticated;
GRANT SELECT, INSERT ON public.messages TO authenticated;
