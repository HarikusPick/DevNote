// Copy this file to BOTH:
//   src/environments/environment.ts        (production: false)
//   src/environments/environment.prod.ts   (production: true)
// then fill in your own Supabase project values.
//
// Use the Supabase "publishable" (anon) key — it is safe to expose in the
// browser because Row-Level Security protects your data. NEVER put the
// service_role / secret key here.
export const environment = {
  production: false,
  supabaseUrl: 'https://YOUR-PROJECT.supabase.co',
  supabaseKey: 'sb_publishable_YOUR_KEY',
};
