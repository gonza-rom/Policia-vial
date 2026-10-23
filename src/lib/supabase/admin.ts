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

/** Busca el usuario de Supabase Auth por email recorriendo todas las páginas. */
export async function buscarUsuarioAuthPorEmail(email: string) {
  const admin = createAdminClient();
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const usuario = data.users.find((u) => u.email === email);
    if (usuario) return usuario;
    if (data.users.length < 200) return null;
  }
}
