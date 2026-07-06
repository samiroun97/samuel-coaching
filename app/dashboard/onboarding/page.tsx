"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const steps = ["Identité", "Entraînement", "Santé", "Objectifs"];

const niveauOptions = [
  { label: "Sédentaire", desc: "0 séance/semaine, travail assis, peu de marche au quotidien" },
  { label: "Légèrement actif", desc: "1 à 2 séances/semaine, ou un métier debout léger" },
  { label: "Modérément actif", desc: "3 à 4 séances/semaine, actif dans la journée" },
  { label: "Très actif", desc: "5 à 6 séances/semaine, ou entraînement + job physique" },
];
const experienceOptions = ["Débutant", "Intermédiaire", "Avancé"];
const lieuOptions = ["Salle de sport", "Maison", "Extérieur", "Mixte"];
const dureeOptions = ["30 min", "45 min", "1h", "1h30+"];
const stressOptions = ["Faible (je dors bien, peu de stress)", "Modéré", "Élevé (peu de sommeil, stress chronique)"];

const initialForm = {
  nom: "", prenom: "", age: "", poids: "", taille: "", sexe: "",
  niveau_activite: "", experience: "", seances_par_semaine: "",
  duree_seance: "", lieu_entrainement: "",
  blessures: "", alimentation: "", sommeil_stress: "",
  objectifs: "",
};

function validateStep(step: number, form: typeof initialForm): string | null {
  if (step === 0) {
    if (!form.prenom) return "Le prénom est requis.";
    if (!form.nom) return "Le nom est requis.";
    if (!form.age) return "L'âge est requis.";
    if (!form.poids) return "Le poids est requis.";
    if (!form.taille) return "La taille est requise.";
    if (!form.sexe) return "Le sexe est requis.";
  }
  if (step === 1) {
    if (!form.niveau_activite) return "Le niveau d'activité est requis.";
    if (!form.experience) return "L'expérience est requise.";
    if (!form.seances_par_semaine) return "Le nombre de séances est requis.";
    if (!form.duree_seance) return "La durée de séance est requise.";
    if (!form.lieu_entrainement) return "Le lieu d'entraînement est requis.";
  }
  if (step === 2) {
    if (!form.blessures) return "Indique tes blessures (ou 'aucune').";
    if (!form.alimentation) return "Indique ton alimentation (ou 'standard').";
    if (!form.sommeil_stress) return "Le niveau de sommeil/stress est requis.";
  }
  if (step === 3) {
    if (!form.objectifs) return "Décris tes objectifs.";
  }
  return null;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [visited, setVisited] = useState<number[]>([0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login");
    });
  }, [router]);

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const goToStep = (i: number) => {
    if (i > step) return;
    setError("");
    setStep(i);
  };

  const next = () => {
    const err = validateStep(step, form);
    if (err) { setError(err); return; }
    setError("");
    const nextStep = step + 1;
    setStep(nextStep);
    setVisited(v => v.includes(nextStep) ? v : [...v, nextStep]);
  };

  const handleSubmit = async () => {
    const err = validateStep(step, form);
    if (err) { setError(err); return; }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").upsert({
      id: user.id, ...form,
      age: parseInt(form.age), poids: parseFloat(form.poids),
      taille: parseFloat(form.taille), seances_par_semaine: parseInt(form.seances_par_semaine),
      updated_at: new Date().toISOString(),
    });
    if (error) { setError("Erreur lors de la sauvegarde."); setLoading(false); }
    else router.push("/dashboard");
  };

  const inputClass = "w-full bg-[#0a0a0a] border border-white/10 text-white placeholder-white/20 text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/50 transition-colors";
  const labelClass = "text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c] block mb-2";
  const chipClass = (active: boolean) =>
    `px-4 py-2.5 text-xs tracking-[0.1em] uppercase border cursor-pointer transition-all duration-200 ${
      active ? "border-[#c9a84c] bg-[#c9a84c]/10 text-[#c9a84c]" : "border-white/10 text-white/40 hover:border-white/30 hover:text-white/60"
    }`;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl tracking-[0.2em] text-white text-center mb-10">
          SAMUEL<span style={{ color: "#c9a84c" }}>.</span><span style={{ color: "#c9a84c" }}>COACHING</span>
        </div>

        {/* Steps indicator */}
        <div className="flex items-start justify-between mb-10 w-full px-4">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <button
                onClick={() => goToStep(i)}
                disabled={i > step}
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  i === step
                    ? "border-[#c9a84c] bg-[#c9a84c] text-black"
                    : i < step
                    ? "border-[#c9a84c] text-[#c9a84c] bg-transparent cursor-pointer hover:bg-[#c9a84c]/10"
                    : "border-white/20 text-white/20 cursor-default"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </button>
              <span className={`text-[0.5rem] tracking-widest uppercase text-center transition-colors duration-300 ${
                i === step ? "text-[#c9a84c]" : i < step ? "text-white/40" : "text-white/20"
              }`}>
                {s}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-[#111] border border-white/10 p-8">

          {/* STEP 0 */}
          {step === 0 && (
            <div className="flex flex-col gap-5">
              <h2 style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl tracking-wider text-white mb-2">TON IDENTITÉ</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Prénom</label><input className={inputClass} placeholder="Samuel" value={form.prenom} onChange={e => set("prenom", e.target.value)} /></div>
                <div><label className={labelClass}>Nom</label><input className={inputClass} placeholder="Waelti" value={form.nom} onChange={e => set("nom", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className={labelClass}>Âge</label><input className={inputClass} type="number" placeholder="28" value={form.age} onChange={e => set("age", e.target.value)} /></div>
                <div><label className={labelClass}>Poids (kg)</label><input className={inputClass} type="number" placeholder="75" value={form.poids} onChange={e => set("poids", e.target.value)} /></div>
                <div><label className={labelClass}>Taille (cm)</label><input className={inputClass} type="number" placeholder="178" value={form.taille} onChange={e => set("taille", e.target.value)} /></div>
              </div>
              <div>
                <label className={labelClass}>Sexe</label>
                <div className="flex gap-3">
                  {["Homme", "Femme"].map(s => <button key={s} type="button" onClick={() => set("sexe", s)} className={chipClass(form.sexe === s)}>{s}</button>)}
                </div>
              </div>
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <h2 style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl tracking-wider text-white mb-2">TON ENTRAÎNEMENT</h2>
              <div>
                <label className={labelClass}>Niveau d'activité général</label>
                <div className="flex flex-col gap-2">
                  {niveauOptions.map(o => (
                    <button key={o.label} type="button" onClick={() => set("niveau_activite", o.label)}
                      className={`px-4 py-3 text-left border cursor-pointer transition-all duration-200 ${form.niveau_activite === o.label ? "border-[#c9a84c] bg-[#c9a84c]/10" : "border-white/10 hover:border-white/30"}`}>
                      <p className={`text-xs tracking-[0.1em] uppercase font-bold ${form.niveau_activite === o.label ? "text-[#c9a84c]" : "text-white/60"}`}>{o.label}</p>
                      <p className="text-[0.65rem] text-white/30 mt-0.5">{o.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Expérience en musculation</label>
                <div className="flex gap-3">
                  {experienceOptions.map(o => <button key={o} type="button" onClick={() => set("experience", o)} className={chipClass(form.experience === o)}>{o}</button>)}
                </div>
              </div>
              <div>
                <label className={labelClass}>Séances / semaine</label>
                <div className="flex gap-2">
                  {["2", "3", "4", "5", "6"].map(n => <button key={n} type="button" onClick={() => set("seances_par_semaine", n)} className={chipClass(form.seances_par_semaine === n)}>{n}</button>)}
                </div>
              </div>
              <div>
                <label className={labelClass}>Durée par séance</label>
                <div className="flex gap-2">
                  {dureeOptions.map(o => <button key={o} type="button" onClick={() => set("duree_seance", o)} className={chipClass(form.duree_seance === o)}>{o}</button>)}
                </div>
              </div>
              <div>
                <label className={labelClass}>Lieu d'entraînement</label>
                <div className="flex gap-2 flex-wrap">
                  {lieuOptions.map(o => <button key={o} type="button" onClick={() => set("lieu_entrainement", o)} className={chipClass(form.lieu_entrainement === o)}>{o}</button>)}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <h2 style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl tracking-wider text-white mb-2">TA SANTÉ</h2>
              <div>
                <label className={labelClass}>Blessures ou douleurs chroniques</label>
                <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Ex : douleur genou gauche... (ou 'aucune')" value={form.blessures} onChange={e => set("blessures", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Alimentation</label>
                <textarea className={`${inputClass} resize-none`} rows={2} placeholder="Ex : végétarien, allergie... (ou 'standard')" value={form.alimentation} onChange={e => set("alimentation", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Sommeil & stress</label>
                <div className="flex flex-col gap-2">
                  {stressOptions.map(o => <button key={o} type="button" onClick={() => set("sommeil_stress", o)} className={chipClass(form.sommeil_stress === o)}>{o}</button>)}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <h2 style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl tracking-wider text-white mb-2">TES OBJECTIFS</h2>
              <div>
                <label className={labelClass}>Décris tes objectifs en 2-3 lignes</label>
                <textarea className={`${inputClass} resize-none`} rows={5} placeholder="Ex : je veux perdre du ventre, gagner en force et me sentir mieux dans mon corps..." value={form.objectifs} onChange={e => set("objectifs", e.target.value)} />
              </div>
            </div>
          )}

          {error && <p className="text-red-400 text-xs mt-4 border border-red-400/20 bg-red-400/5 px-3 py-2">{error}</p>}
        </div>

        {/* Navigation */}
        <div className="flex gap-4 mt-6">
          {step > 0 && (
            <button onClick={() => { setError(""); setStep(s => s - 1); }} className="flex-1 border border-white/10 text-white/50 text-xs tracking-[0.15em] uppercase py-4 hover:border-white/30 hover:text-white transition-colors">
              ← Retour
            </button>
          )}
          {step < steps.length - 1 ? (
            <button onClick={next} className="flex-1 bg-[#c9a84c] text-black text-xs font-bold tracking-[0.15em] uppercase py-4 hover:bg-[#e2c97e] transition-colors">
              Suivant →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-[#c9a84c] text-black text-xs font-bold tracking-[0.15em] uppercase py-4 hover:bg-[#e2c97e] transition-colors disabled:opacity-50">
              {loading ? "Enregistrement..." : "Terminer ✓"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
