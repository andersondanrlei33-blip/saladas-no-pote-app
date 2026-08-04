"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DefinirSenhaPage() {
  const router = useRouter();
  const supabase = createClient();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

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
      setErro("Não deu pra salvar a senha. Tente abrir o link do e-mail de novo.");
      return;
    }

    router.push("/receitas");
    router.refresh();
  }

  return (
    <div className="sp-container">
      <div className="sp-card">
        <h1 style={{ fontSize: 20, marginTop: 0 }}>Escolha sua senha</h1>
        <p style={{ fontSize: 14, color: "#666" }}>
          Só falta isso — depois é só usar seu e-mail e essa senha pra entrar sempre que quiser ver as receitas.
        </p>
        {erro && <p className="sp-erro">{erro}</p>}
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
      </div>
    </div>
  );
}
