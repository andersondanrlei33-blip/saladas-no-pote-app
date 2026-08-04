import { createBrowserClient } from "@supabase/ssr";

/** Cliente Supabase pra uso no browser (Client Components: formulário de
 *  login, tela de definir senha). Usa só a chave pública — nunca a service
 *  role aqui. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
