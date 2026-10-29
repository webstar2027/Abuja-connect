// Local preview fallback. On Render, server.js dynamically serves /config.js
// using SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY environment variables.
// Use only a Supabase publishable key here, never a secret/service_role key.
window.ABUJA_CONFIG = {
  supabaseUrl: "",
  supabasePublishableKey: ""
};
