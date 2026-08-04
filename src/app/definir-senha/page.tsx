"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DefinirSenhaPage() {
  const router = useRouter();
  // IMPORTANTE: precisa ser UM SÓ cliente pra vida inteira do componente,
  // criado com useState(() => ...) (inicializador "preguiçoso"). Antes
  // estava como "const supabase = createClient()" direto no corpo da
  // função — isso cria uma instância NOVA a cada re-render (e o componente
  // re-renderiza a cada tecla digitada). Cada instância nova dispara de
  // novo, em segundo plano, a leitura do token que vem no fragmento da URL
  // (#access_token=...). Com useState, a mesma instância é reusada em
  // todos os re-renders.
  const [supabase] = useState(() => createClient());

  // null = ainda checando se o link já criou sessão; false = não criou
  // (precisa do código); true = sessão ok, mostra o formulário de senha.
  const [temSessao, setTemSessao] = useState<boolean | null>(null);

  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [verificandoCodigo, setVerificandoCodigo] = useState(false);

  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    // Descobrimos (via logs de Auth do Supabase) que o link do e-mail é
    // acessado DUAS vezes: um scanner de segurança do provedor de e-mail
    // (Gmail/Outlook) pré-visita o link pra checar se é seguro, e isso
    // sozinho já consome o token (que só pode ser usado uma vez). Quando a
    // pessoa clica de verdade, o token já morreu e ela cai aqui sem sessão
    // — mesmo fazendo tudo certo. Por isso a página tem um plano B: pedir
    // o código de verificação que também vai no e-mail ({{ .Token }}), já
    // que um scanner automático não consegue "digitar" esse código.
    async function checar() {
      const hash = window.location.hash;
      if (hash.includes("access_token")) {
        // Deixa o cliente Supabase (detectSessionInUrl) processar o hash.
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      const { data } = await supabase.auth.getSession();
      setTemSessao(!!data.session);
    }
    checar();
  }, [supabase]);

  async function confirmarCodigo(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!email.trim() || codigo.trim().length < 6) {
      setErro("Preenche o e-mail e o código de 6 dígitos que chegou na mensagem.");
      return;
    }

    setVerificandoCodigo(true);
    // O mesmo código serve tanto pro e-mail de convite (primeira compra)
    // quanto pro de recuperação de senha — tenta os dois tipos.
    let resultado = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: codigo.trim(),
      type: "recovery",
    });
    if (resultado.error) {
      resultado = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: codigo.trim(),
        type: "invite",
      });
    }
    setVerificandoCodigo(false);

    if (resultado.error) {
      setErro(`Código não confere ou já expirou (${resultado.error.message}). Confere se digitou certo ou peça um e-mail novo.`);
      return;
    }

    setTemSessao(true);
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmacao) {
      setErro("As senhas não são iguais.");
      return;
    }

    setCarregando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setCarregando(false);

    if (error) {
      setErro(`Não deu pra salvar a senha (${error.message}). Tente de novo.`);
      return;
    }

    router.push("/receitas");
    router.refresh();
  }

  return (
    <div className="sp-container">
      <div className="sp-card">
        {temSessao !== false && (
          <>
            <h1 style={{ fontSize: 20, marginTop: 0 }}>Escolha sua senha</h1>
            <p style={{ fontSize: 14, color: "#666" }}>
              Só falta isso — depois é só usar seu e-mail e essa senha pra entrar sempre que quiser ver as receitas.
            </p>
          </>
        )}

        {temSessao === null && <p style={{ fontSize: 14, color: "#666" }}>Verificando o link...</p>}

        {erro && <p className="sp-erro">{erro}</p>}

        {temSessao === false && (
          <>
            <h1 style={{ fontSize: 20, marginTop: 0 }}>Confirme o código</h1>
            <p style={{ fontSize: 14, color: "#666" }}>
              O link direto não funcionou dessa vez (o provedor de e-mail costuma "visitar" o link sozinho antes de
              você clicar, o que invalida ele). Sem problema: digita seu e-mail e o código de verificação que também
              veio na mensagem.
            </p>
            <form onSubmit={confirmarCodigo}>
              <input
                className="sp-input"
                type="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                className="sp-input"
                type="text"
                inputMode="numeric"
                placeholder="Código de verificação"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                required
              />
              <button className="sp-btn" type="submit" disabled={verificandoCodigo}>
                {verificandoCodigo ? "Confirmando..." : "Confirmar código"}
              </button>
            </form>
          </>
        )}

        {temSessao === true && (
          <form onSubmit={salvar}>
            <input
              className="sp-input"
              type="password"
              placeholder="Nova senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
            <input
              className="sp-input"
              type="password"
              placeholder="Confirme a senha"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              required
            />
            <button className="sp-btn" type="submit" disabled={carregando}>
              {carregando ? "Salvando..." : "Salvar e ver as receitas"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
