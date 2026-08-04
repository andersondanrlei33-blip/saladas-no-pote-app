"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) {
      setErro("E-mail ou senha incorretos. Se essa é sua primeira vez aqui, confira o e-mail que a gente mandou com o link de acesso.");
      return;
    }
    router.push("/receitas");
    router.refresh();
  }

  return (
    <div className="sp-container">
      <div className="sp-card">
        <h1 style={{ fontSize: 20, marginTop: 0 }}>Saladas no Pote 🥗</h1>
        <p style={{ fontSize: 14, color: "#666" }}>Entre com o e-mail e a senha que você cadastrou.</p>
        {erro && <p className="sp-erro">{erro}</p>}
        <form onSubmit={entrar}>
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
            type="password"
            placeholder="Sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
          <button className="sp-btn" type="submit" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p style={{ fontSize: 12, color: "#888", marginTop: 16 }}>
          Ainda não comprou? <a href="https://brenoplus.online/saladas">Conheça as receitas</a>
        </p>
      </div>
    </div>
  );
}
