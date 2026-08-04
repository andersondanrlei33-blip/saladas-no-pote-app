import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./LogoutButton";

interface Receita {
  id: string;
  tipo: "salada" | "smoothie" | "shot" | "agua";
  ordem: number;
  nome: string;
  calorias: number | null;
  conservacao_dias: number | null;
  molho: string | null;
  ingredientes: string | null;
  camadas: string[] | null;
  modo_preparo: string | null;
}

const TITULO_TIPO: Record<Receita["tipo"], string> = {
  salada: "60 Saladas no Pote",
  smoothie: "Bônus 1: Smoothies Detox",
  shot: "Bônus 2: Shots Matinais",
  agua: "Bônus 3: Águas Saborizadas",
};

export default async function ReceitasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("receitas")
    .select("*")
    .order("tipo", { ascending: true })
    .order("ordem", { ascending: true });

  const receitas = (data ?? []) as Receita[];
  const grupos: Record<Receita["tipo"], Receita[]> = { salada: [], smoothie: [], shot: [], agua: [] };
  for (const r of receitas) grupos[r.tipo].push(r);

  return (
    <div className="sp-container" style={{ maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Suas receitas 🥗</h1>
        <LogoutButton />
      </div>

      {(Object.keys(grupos) as Receita["tipo"][]).map((tipo) =>
        grupos[tipo].length === 0 ? null : (
          <section key={tipo} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>{TITULO_TIPO[tipo]}</h2>
            <div style={{ display: "grid", gap: 12 }}>
              {grupos[tipo].map((r) => (
                <details key={r.id} className="sp-card" style={{ padding: "14px 18px" }}>
                  <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 15 }}>
                    {r.nome}
                    {r.calorias ? ` · ${r.calorias} kcal` : ""}
                  </summary>
                  <div style={{ marginTop: 12, fontSize: 14, color: "#444" }}>
                    {r.conservacao_dias && (
                      <p style={{ margin: "0 0 8px" }}>
                        <strong>Conservação:</strong> até {r.conservacao_dias} dias na geladeira
                      </p>
                    )}
                    {r.molho && (
                      <p style={{ margin: "0 0 8px" }}>
                        <strong>Molho:</strong> {r.molho}
                      </p>
                    )}
                    {r.ingredientes && (
                      <p style={{ margin: "0 0 8px" }}>
                        <strong>Ingredientes:</strong> {r.ingredientes}
                      </p>
                    )}
                    {r.camadas && r.camadas.length > 0 && (
                      <>
                        <strong>Montagem (em camadas, nessa ordem):</strong>
                        <ol style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                          {r.camadas.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ol>
                      </>
                    )}
                    {r.modo_preparo && (
                      <p style={{ margin: "8px 0 0" }}>
                        <strong>Modo de preparo:</strong> {r.modo_preparo}
                      </p>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </section>
        )
      )}

      <div className="sp-card" style={{ textAlign: "center", background: "var(--sp-verde)", color: "#fff" }}>
        <p style={{ margin: "0 0 6px", fontWeight: 700 }}>Quer um plano completo, feito pra você?</p>
        <p style={{ margin: "0 0 14px", fontSize: 14 }}>
          Agende uma consulta nutricional de verdade e receba um plano alimentar personalizado.
        </p>
        <a
          href="#"
          style={{
            display: "inline-block",
            background: "#fff",
            color: "var(--sp-verde)",
            padding: "10px 20px",
            borderRadius: 8,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Quero agendar minha consulta
        </a>
      </div>
    </div>
  );
}
