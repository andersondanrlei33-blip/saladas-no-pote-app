"use client";

import { useState, Suspense, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Por que essa página existe (e não manda direto pro {{ .ConfirmationURL }}
 *  da Supabase):
 *
 *  Descobrimos (via Auth Logs) que o link padrão da Supabase
 *  ({{ .ConfirmationURL }}, que aponta pro endpoint deles
 *  /auth/v1/verify) é acessado automaticamente por scanners de segurança
 *  de e-mail (Gmail/Outlook) ANTES da pessoa clicar de verdade — só de
 *  visitar a URL (um GET simples), o token de uso único já é consumido lá
 *  no servidor da Supabase. Como o código numérico ({{ .Token }}) do
 *  e-mail é só outra forma de representar o MESMO token, o scanner também
 *  invalida o código, mesmo ele nunca tendo sido "visto" pelo link.
 *
 *  A solução: em vez de linkar direto pro endpoint da Supabase, o e-mail
 *  linka pra ESSA página nossa (/confirmar?token_hash=...&type=...). Um
 *  scanner que só dá GET aqui recebe uma página HTML comum — nada é
 *  verificado ainda. A verificação (supabase.auth.verifyOtp) só roda
 *  quando a PESSOA clica no botão "Confirmar e continuar". Scanners de
 *  segurança normalmente não simulam cliques em botões, então o token
 *  sobrevive até o clique de verdade. */
function ConfirmarConteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createClient());
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const tokenHash = searchParams.get("token_hash");
  const tipo = (searchParams.get("type") ?? "recovery") as
    | "recovery"
    | "invite"
    | "signup"
    | "magiclink"
    | "email_change"
    | "email";

  async function confirmar(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!tokenHash) {
      setErro("Link incompleto. Peça um e-mail novo.");
      return;
    }

    setConfirmando(true);
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: tipo,
    });
    setConfirmando(false);

    if (error) {
      setErro(
        `Esse link não é mais válido (${error.message}). Isso costuma acontecer quando o provedor de e-mail "visita" o link sozinho antes de você clicar. Peça um novo e-mail e clique nele direto.`,
      );
      return;
    }

    router.push("/definir-senha");
    router.refresh();
  }

  return (
    <div className="sp-container">
      <div className="sp-card">
        <h1 style={{ fontSize: 20, marginTop: 0 }}>Confirmar acesso</h1>
        <p style={{ fontSize: 14, color: "#666" }}>Clique no botão abaixo pra confirmar e continuar.</p>
        {erro && <p className="sp-erro">{erro}</p>}
        <form onSubmit={confirmar}>
          <button className="sp-btn" type="submit" disabled={confirmando || !tokenHash}>
            {confirmando ? "Confirmando..." : "Confirmar e continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ConfirmarPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmarConteudo />
    </Suspense>
  );
}
