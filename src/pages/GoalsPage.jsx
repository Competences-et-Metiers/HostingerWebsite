import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
// import { supabase } from "@/lib/customSupabaseClient" // optional

// 1) Adjustable config
const STEPS = [1, 2, 3] // affects both phases; change length to alter columns

export const GOAL_ROWS = [
  { id: "01", label: "Présenter son parcours personnel, professionnel et extraprofessionnel, ainsi que les compétences associées" },
  { id: "02", label: "Identifier ses aptitudes dans une classification : savoirs, savoirs être et savoirs faire" },
  { id: "03", label: "Repérer mes compétences transférables, ses qualités" },
  { id: "04", label: "Identifier des pistes de métier / de formation" },
  { id: "05", label: "Connaître ses centres d’intérêts" },
  { id: "06", label: "Nommer ses valeurs & Définir ses motivations profondes" },
  { id: "07", label: "Définir les missions souhaitées dans le quotidien professionnel" },
  { id: "08", label: "Identifier un projet professionnel (ou élaborer une ou plusieurs alternatives)" },
  { id: "09", label: "Choisir un métier qui me correspond, selon mes critères, et justifier ce choix" },
  { id: "10", label: "Si choix de formation, Identifier et nommer celle(s) qui me conviennent (tarif, durée, distance …), ainsi que leurs attendus (compétences, connaissances)"},
  { id: "11", label: "Identifier mes axes d’améliorations (au regard d’un projet et /ou au sens large)"},
  { id: "12", label: "Valider l’engagement de mon entourage pour mon projet professionnel ou de formation"},
  { id: "13", label: "Se sentir autonome dans l’atteinte de l’objectif fixé / dans son avenir professionnel"},
  { id: "14", label: "Avoir confiance en soi"},
  { id: "15", label: "Avoir confiance en soi"},
  { id: "16", label: "Communiquer sur les réseaux sociaux : mise en avant de profils, diffusion de CV, portfolio…"},
  { id: "17", label: "Créer des liens avec des recruteurs, des agences de placement (création d’alertes d’offre d’emploi ou de formation)"},
  { id: "18", label: "Savoir se présenter de manière audible et concise en entretien."},
  { id: "19", label: "Argumenter dans le cadre d’un entretien d’embauche"},
  { id: "20", label: "Apporter des réponses précises et explicites par rapport à des questions posées en entretien"},
  { id: "21", label: "Adopter une attitude positive et un langage adapté dans une situation de communication (face à face et/ou par téléphone)"},
  { id: "22", label: "Identifier le type d’entreprise sollicitée dans une démarche de recherche d’emploi"}
]

// 2) Helpers to build/modify state
const emptyMatrix = (rows) =>
  rows.reduce((acc, r) => {
    acc[r.id] = {
      prelim: Array(STEPS.length).fill(false),
      conclu: Array(STEPS.length).fill(false),
    }
    return acc
  }, {})

export default function GoalsPage() {
  const rows = useMemo(() => GOAL_ROWS, [])
  const [matrix, setMatrix] = useState(() => emptyMatrix(rows))
  const [saving, setSaving] = useState(false)

  const toggle = (rowId, phase, stepIdx) => {
    setMatrix((prev) => {
      const next = structuredClone(prev)
      next[rowId][phase][stepIdx] = !next[rowId][phase][stepIdx]
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Example payload you can persist to Supabase or send to Dendreo
      const payload = {
        type: "goals-grid",
        steps: STEPS,
        data: matrix,
        submitted_at: new Date().toISOString(),
      }

      // Optional Supabase persistence
      // const { error } = await supabase.from("bdc_goals_matrix").insert(payload)
      // if (error) throw error

      toast({ title: "Objectifs enregistrés ✅", description: "Vos sélections ont été sauvegardées." })
    } catch (err) {
      console.error(err)
      toast({ title: "Échec de l’enregistrement", description: String(err?.message || err), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => setMatrix(emptyMatrix(rows))

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <header className="rounded-md border p-4 bg-slate-50/30">
        <h1 className="text-lg font-semibold">Objectifs co‑définis sur l’accompagnement au BDC</h1>
        <p className="text-sm text-muted-foreground">Cochez les cases atteintes à chaque phase.</p>
      </header>

      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-[860px] w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/30">
              <th rowSpan={2} className="border px-4 py-3 text-left font-semibold w-[55%]">
                Objectifs
              </th>
              <th colSpan={STEPS.length} className="border px-4 py-3 text-center font-semibold">
                Phase préliminaire
              </th>
              <th colSpan={STEPS.length} className="border px-4 py-3 text-center font-semibold">
                Phase conclusion
              </th>
            </tr>
            <tr className="bg-slate-50/30">
              {STEPS.map((s) => (
                <th key={`pre-${s}`} className="border px-2 py-2 text-center text-sm">{s}*</th>
              ))}
              {STEPS.map((s) => (
                <th key={`con-${s}`} className="border px-2 py-2 text-center text-sm">{s}*</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, rIdx) => (
              <tr key={row.id} className={rIdx % 2 ? "bg-slate-50/30" : "bg-slate-50/30"}>
                <td className="border px-4 py-3 align-top">
                  <span className="block">{row.label}</span>
                </td>

                {STEPS.map((_, i) => (
                  <td key={`pre-${row.id}-${i}`} className="border px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      aria-label={`Préliminaire ${i + 1} pour ${row.label}`}
                      checked={matrix[row.id].prelim[i]}
                      onChange={() => toggle(row.id, "prelim", i)}
                      className="h-5 w-5 accent-slate-800"
                    />
                  </td>
                ))}

                {STEPS.map((_, i) => (
                  <td key={`con-${row.id}-${i}`} className="border px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      aria-label={`Conclusion ${i + 1} pour ${row.label}`}
                      checked={matrix[row.id].conclu[i]}
                      onChange={() => toggle(row.id, "conclu", i)}
                      className="h-5 w-5 accent-slate-800"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</Button>
        <Button type="button" variant="secondary" onClick={resetForm}>Réinitialiser</Button>
        <Button type="button" variant="outline" onClick={() => window.print()}>Imprimer</Button>
      </div>
    </form>
  )
}
