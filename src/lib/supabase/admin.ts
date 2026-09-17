import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con service_role — solo para scripts de servidor (seed, alta de
 * agentes). Nunca importar desde código que se ejecute en el navegador.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
