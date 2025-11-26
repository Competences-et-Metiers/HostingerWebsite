import React, { useMemo, useState, useEffect } from "react"
import { useOutletContext } from "react-router-dom"
import { motion } from "framer-motion"
import { Helmet } from "react-helmet"
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

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      <Helmet>
        <title>Objectifs - Plateforme Bilan de Compétences</title>
        <style type="text/css">{`
          @media print {
            /* Hide everything except the goals table */
            body > div:not(#root) { display: none !important; }
            header, nav, aside, footer { display: none !important; }
            .no-print { display: none !important; }
            
            /* Reset page margins for print - portrait orientation */
            @page {
              margin: 0.8cm;
              size: portrait;
            }
            
            /* Make sure the table is visible and styled */
            body {
              background: white !important;
              color: black !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            
            /* Container for centering */
            #root {
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              width: 100% !important;
            }
            
            /* Style table for print */
            table {
              page-break-inside: auto;
              border-collapse: collapse;
              width: 100% !important;
              max-width: 100% !important;
              font-size: 7px !important;
              margin: 0 auto !important;
            }
            
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            
            th, td {
              border: 1px solid #333 !important;
              padding: 3px 2px !important;
              background: white !important;
              font-size: 7px !important;
              line-height: 1.2 !important;
            }
            
            th {
              background: #f0f0f0 !important;
              font-weight: bold;
              color: black !important;
              padding: 4px 2px !important;
            }
            
            /* First column with objective text */
            td:first-child {
              font-size: 6.5px !important;
              padding: 2px 3px !important;
              max-width: 45% !important;
              word-wrap: break-word !important;
            }
            
            th:first-child {
              max-width: 45% !important;
            }
            
            /* Checkbox cells */
            td:not(:first-child) {
              text-align: center !important;
              padding: 2px !important;
              width: auto !important;
            }
            
            /* Make text readable */
            * {
              color: black !important;
              background: transparent !important;
            }
            
            /* Keep table backgrounds */
            table, th, td {
              background: white !important;
            }
            
            th[colspan] {
              background: #e0e0e0 !important;
            }
            
            /* Show checkboxes properly - smaller for fitting */
            input[type="checkbox"] {
              -webkit-appearance: checkbox;
              appearance: checkbox;
              width: 10px !important;
              height: 10px !important;
              margin: 0 !important;
            }
            
            /* Print header */
            .print-header {
              display: block !important;
              margin-bottom: 10px !important;
              text-align: center;
              width: 100% !important;
            }
            
            .print-only {
              display: block !important;
            }
            
            /* Table container */
            .overflow-x-auto {
              overflow: visible !important;
              width: 100% !important;
            }
            
            /* Form and sections */
            form, section {
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            /* Card backgrounds */
            .bg-white\\/10 {
              background: transparent !important;
              border: none !important;
              padding: 0 !important;
            }
          }
          
          .print-only {
            display: none;
          }
        `}</style>
      </Helmet>
      
      <section className="space-y-8">
        {(() => {
          const { setHeader } = useOutletContext() || {};
          useEffect(() => {
            setHeader && setHeader('Objectifs co‑définis', 'Suivez votre progression à chaque phase de votre bilan');
          }, [setHeader]);
          return null;
        })()}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Print-only header */}
          <div className="print-only print-header">
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
              Objectifs co-définis sur l'accompagnement au BDC
            </h1>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Bilan de Compétences - {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 no-print">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white mb-2">Objectifs d'accompagnement au BDC</h2>
                <p className="text-sm text-white/70">Cochez les cases correspondant aux objectifs atteints à chaque phase.</p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              {/* Table description for print */}
              <div className="print-only" style={{ marginBottom: '15px', fontSize: '12px' }}>
                <p>Cochez les cases correspondant aux objectifs atteints à chaque phase.</p>
              </div>

              <div className="overflow-x-auto rounded-lg">
                <table className="min-w-[860px] w-full border-collapse">
                  <thead>
                    <tr className="bg-white/5">
                      <th rowSpan={2} className="border border-white/20 px-4 py-3 text-left font-semibold text-white w-[55%]">
                        Objectifs
                      </th>
                      <th colSpan={STEPS.length} className="border border-white/20 px-4 py-3 text-center font-semibold text-white bg-purple-500/20">
                        Phase préliminaire
                      </th>
                      <th colSpan={STEPS.length} className="border border-white/20 px-4 py-3 text-center font-semibold text-white bg-pink-500/20">
                        Phase conclusion
                      </th>
                    </tr>
                    <tr className="bg-white/5">
                      {STEPS.map((s) => (
                        <th key={`pre-${s}`} className="border border-white/20 px-2 py-2 text-center text-sm text-white/90 bg-purple-500/10">
                          {s}*
                        </th>
                      ))}
                      {STEPS.map((s) => (
                        <th key={`con-${s}`} className="border border-white/20 px-2 py-2 text-center text-sm text-white/90 bg-pink-500/10">
                          {s}*
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((row, rIdx) => (
                      <motion.tr 
                        key={row.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: rIdx * 0.02 }}
                        className={rIdx % 2 === 0 ? "bg-white/5" : "bg-white/[0.02]"}
                      >
                        <td className="border border-white/20 px-4 py-3 align-top">
                          <span className="block text-white/90 text-sm">{row.label}</span>
                        </td>

                        {STEPS.map((_, i) => (
                          <td key={`pre-${row.id}-${i}`} className="border border-white/20 px-2 py-2 text-center">
                            <input
                              type="checkbox"
                              aria-label={`Préliminaire ${i + 1} pour ${row.label}`}
                              checked={matrix[row.id].prelim[i]}
                              onChange={() => toggle(row.id, "prelim", i)}
                              className="h-5 w-5 accent-purple-500 cursor-pointer hover:scale-110 transition-transform"
                            />
                          </td>
                        ))}

                        {STEPS.map((_, i) => (
                          <td key={`con-${row.id}-${i}`} className="border border-white/20 px-2 py-2 text-center">
                            <input
                              type="checkbox"
                              aria-label={`Conclusion ${i + 1} pour ${row.label}`}
                              checked={matrix[row.id].conclu[i]}
                              onChange={() => toggle(row.id, "conclu", i)}
                              className="h-5 w-5 accent-pink-500 cursor-pointer hover:scale-110 transition-transform"
                            />
                          </td>
                        ))}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap no-print">
              <Button 
                type="submit" 
                disabled={saving}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-6"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button 
                type="button" 
                onClick={resetForm}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                Réinitialiser
              </Button>
              <Button 
                type="button" 
                onClick={handlePrint}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                Imprimer
              </Button>
            </div>
          </form>
        </motion.div>
      </section>
    </>
  )
}
