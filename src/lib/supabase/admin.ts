import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/** Cliente Supabase com a service role — IGNORA o RLS. Só pode ser usado em
 *  código que roda no servidor e nunca é exposto ao navegador (ex: a rota
 *  do webhook da Cakto, pra criar o acesso do comprador). Nunca importar
 *  isso em Client Components. */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
