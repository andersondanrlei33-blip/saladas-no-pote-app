import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Pra onde o link do e-mail de convite (mandado pelo webhook da Cakto)
 *  aponta. Troca o código pela sessão e manda a pessoa definir a senha. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/definir-senha`);
}
