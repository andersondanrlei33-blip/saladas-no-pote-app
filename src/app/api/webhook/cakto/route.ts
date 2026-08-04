import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Webhook da Cakto — "compra aprovada" chama essa rota. Formato do corpo
 *  confirmado no modelo de exemplo do próprio painel da Cakto (tela de
 *  criação do webhook):
 *    { "secret": "...", "event": "purchase_approved",
 *      "data": { "id", "refId", "customer": { "name","email","phone",... },
 *                "baseAmount", "status": "paid", ... } }
 *
 *  Aqui a gente:
 *   1. SEMPRE guarda o payload bruto em `compras.raw_payload`, mesmo que a
 *      extração abaixo falhe — assim dá pra conferir o formato real e
 *      ajustar os campos com o "Testar" do webhook na Cakto sem perder
 *      nenhum evento.
 *   2. Tenta extrair email/nome/id da transação/status em alguns formatos
 *      (o confirmado primeiro, variações depois como fallback).
 *   3. Só libera acesso (cria a conta e manda o e-mail de convite) se
 *      achar um e-mail e o evento parecer de aprovação.
 *
 *  Segurança: a Cakto manda o segredo configurado no campo "secret" do
 *  próprio corpo JSON (não como header nem query string). A gente valida
 *  esse campo; mantém a checagem por query string (?secret=...) como
 *  fallback, sem custo, caso algum outro disparo use esse formato. */

function primeiroValor(obj: unknown, caminhos: string[]): string | null {
  for (const caminho of caminhos) {
    let atual: unknown = obj;
    for (const chave of caminho.split(".")) {
      if (atual && typeof atual === "object" && chave in (atual as Record<string, unknown>)) {
        atual = (atual as Record<string, unknown>)[chave];
      } else {
        atual = undefined;
        break;
      }
    }
    if (typeof atual === "string" && atual.trim() !== "") return atual;
    if (typeof atual === "number") return String(atual);
  }
  return null;
}

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }

  const secretEsperado = process.env.CAKTO_WEBHOOK_SECRET;
  const secretRecebido =
    primeiroValor(payload, ["secret"]) ?? request.nextUrl.searchParams.get("secret");
  if (!secretEsperado || secretRecebido !== secretEsperado) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const evento = primeiroValor(payload, ["event", "evento", "data.status", "status"]);
  const email = primeiroValor(payload, [
    "data.customer.email",
    "customer.email",
    "data.email",
    "email",
    "buyer.email",
  ]);
  const nome = primeiroValor(payload, [
    "data.customer.name",
    "customer.name",
    "data.name",
    "name",
    "buyer.name",
  ]);
  const transacaoId = primeiroValor(payload, [
    "data.id",
    "id",
    "data.refId",
    "data.transaction_id",
    "transaction_id",
  ]);
  const valorTexto = primeiroValor(payload, ["data.baseAmount", "data.amount", "amount", "valor"]);

  const pareceAprovado =
    evento !== null && /aprovad|approved|paid|pago/i.test(evento);

  const admin = createAdminClient();

  await admin.from("compras").insert({
    email: email ?? "desconhecido@sem-email",
    nome,
    transacao_id: transacaoId,
    produto: "Saladas no Pote + Molhos Irresistíveis",
    valor: valorTexto ? Number(valorTexto) : null,
    status: evento ?? "desconhecido",
    raw_payload: payload,
    processado: false,
  });

  if (pareceAprovado && email) {
    const { error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { nome },
      // Vai direto pra /definir-senha (Client Component) e NÃO para
      // /auth/callback: o link de convite da Supabase manda o token como
      // fragmento de URL (#access_token=...), e fragmento nunca chega ao
      // servidor. Se o redirect passasse por uma rota de servidor que faz
      // 302 pra outra página (como /auth/callback fazia), o fragmento se
      // perderia no meio do caminho e a sessão nunca seria criada. O
      // cliente Supabase do browser (createBrowserClient, com
      // detectSessionInUrl ligado por padrão) só consegue ler esse
      // fragmento se ele já estiver na URL quando a página carrega.
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/definir-senha`,
    });
    // Se o e-mail já tem conta (recompra, ou webhook duplicado), o
    // inviteUserByEmail retorna erro "already been registered" — não é um
    // problema real, só significa que ela já tem acesso.
    if (!error || /already/i.test(error.message)) {
      await admin
        .from("compras")
        .update({ processado: true })
        .eq("transacao_id", transacaoId ?? "");
    }
  }

  return NextResponse.json({ recebido: true });
}
