-- Trigger functions are only invoked by triggers; they should not be callable via the Data API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM public, anon, authenticated;
-- current_profile_id and is_username_available must stay executable: RLS policies and the app call them.