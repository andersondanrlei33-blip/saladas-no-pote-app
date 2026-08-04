import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

interface CookieParaDefinir {
  name: string;
  value: string;
  options?: CookieOptions;
}

/** Cliente Supabase pra uso em Server Components e Route Handlers — lê/grava
 *  a sessão via cookies do Next.js. Usa a chave pública (respeita RLS), não
 *  a service role. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieParaDefinir[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Chamado de dentro de um Server Component — ignora, o
            // middleware já cuida de renovar a sessão nesse caso.
          }
        },
      },
    }
  );
}
