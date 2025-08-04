'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { modernDesign } from '@/utils/modernDesign'
import ModernNavbar from '@/components/ModernNavbar'

interface Candidate {
  id: string
  firstName: string
  lastName: string
  email: string
  registeredAt: string
  interview?: {
    id: string
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'
    completedAt?: string
    conductedBy?: string
    decision?: 'FAVORABLE' | 'DEFAVORABLE' | 'A_SURVEILLER'
  }
}

interface Session {
  id: string
  name: string
  date: string
  location: string
  maxCandidates: number
  status: string
}

interface InterviewQuestion {
  id: string
  question: string
  category: string
}

interface Situation {
  id: string
  title: string
  description: string
  expectedResponse: string
  difficulty: string
}

interface InterviewData {
  questions: Array<{
    questionId: string
    question: string
    answer: string
    rating: number
  }>
  situations: Array<{
    situationId: string
    title: string
    description: string
    expectedResponse: string
    candidateResponse: string
    evaluation: 'GOOD' | 'AVERAGE' | 'BAD'
  }>
  additionalNotes: string
  finalDecision: 'FAVORABLE' | 'DEFAVORABLE' | 'A_SURVEILLER'
}

export default function SessionDetailsPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string

  const [sessionData, setSessionData] = useState<Session | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal d'entretien
  const [showInterviewModal, setShowInterviewModal] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [interviewStep, setInterviewStep] = useState<'questions' | 'situations' | 'final'>('questions')
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>([])
  const [selectedSituations, setSelectedSituations] = useState<Situation[]>([])
  const [interviewData, setInterviewData] = useState<InterviewData>({
    questions: [],
    situations: [],
    additionalNotes: '',
    finalDecision: 'FAVORABLE'
  })

  // Modal de compte-rendu
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportData, setReportData] = useState<any>(null)

  useEffect(() => {
    fetchSessionData()
    fetchCandidates()
  }, [sessionId])

  useEffect(() => {
    const filtered = candidates.filter(candidate =>
      `${candidate.firstName} ${candidate.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredCandidates(filtered)
  }, [candidates, searchTerm])

  const fetchSessionData = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`)
      if (!response.ok) throw new Error('Erreur lors du chargement')
      const data = await response.json()
      setSessionData(data)
    } catch (err) {
      setError('Impossible de charger les détails de la session')
    }
  }

  const fetchCandidates = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/candidates`)
      if (!response.ok) throw new Error('Erreur lors du chargement')
      const data = await response.json()
      setCandidates(data)
    } catch (err) {
      setError('Impossible de charger les candidats')
    } finally {
      setLoading(false)
    }
  }

  const fetchInterviewQuestions = async () => {
    try {
      const response = await fetch('/api/interview-questions')
      if (!response.ok) throw new Error('Erreur lors du chargement')
      const data = await response.json()
      setInterviewQuestions(data)
      
      // Initialiser les questions dans interviewData
      setInterviewData(prev => ({
        ...prev,
        questions: data.map((q: InterviewQuestion) => ({
          questionId: q.id,
          question: q.question,
          answer: '',
          rating: 5
        }))
      }))
    } catch (err) {
      setError('Impossible de charger les questions d\'entretien')
    }
  }

  const fetchRandomSituations = async () => {
    try {
      const response = await fetch('/api/situations')
      if (!response.ok) throw new Error('Erreur lors du chargement')
      const allSituations = await response.json()
      
      // Sélectionner 3 situations aléatoirement
      const shuffled = allSituations.sort(() => 0.5 - Math.random())
      const selected = shuffled.slice(0, 3)
      setSelectedSituations(selected)
      
      // Initialiser les situations dans interviewData
      setInterviewData(prev => ({
        ...prev,
        situations: selected.map((s: Situation) => ({
          situationId: s.id,
          title: s.title,
          description: s.description,
          expectedResponse: s.expectedResponse,
          candidateResponse: '',
          evaluation: 'GOOD' as const
        }))
      }))
    } catch (err) {
      setError('Impossible de charger les situations')
    }
  }

  const startInterview = async (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setInterviewStep('questions')
    setShowInterviewModal(true)
    
    // Marquer l'entretien comme "en cours" et assigner à l'utilisateur
    try {
      const response = await fetch(`/api/sessions/${sessionId}/candidates/${candidate.id}/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'IN_PROGRESS',
          conductedBy: session?.user.firstName ? `${session.user.firstName} ${session.user.lastName}` : session?.user.username
        })
      })
      
      if (response.ok) {
        // Recharger les candidats pour mettre à jour l'affichage
        await fetchCandidates()
      }
    } catch (err) {
      console.error('Erreur lors de la prise en charge:', err)
    }
    
    await fetchInterviewQuestions()
    await fetchRandomSituations()
  }

  const viewReport = async (candidate: Candidate) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/candidates/${candidate.id}/interview`)
      if (!response.ok) throw new Error('Erreur lors du chargement')
      const data = await response.json()
      setReportData(data)
      setShowReportModal(true)
    } catch (err) {
      setError('Impossible de charger le compte-rendu')
    }
  }

  const unassignInterview = async (candidate: Candidate) => {
    if (!confirm('Êtes-vous sûr de vouloir désaffecter cet entretien ?')) return
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}/candidates/${candidate.id}/interview`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Erreur lors de la désaffectation')
      await fetchCandidates()
    } catch (err) {
      setError('Impossible de désaffecter l\'entretien')
    }
  }

  const updateQuestionAnswer = (questionId: string, answer: string, rating: number) => {
    setInterviewData(prev => ({
      ...prev,
      questions: prev.questions.map(q =>
        q.questionId === questionId ? { ...q, answer, rating } : q
      )
    }))
  }

  const updateSituationResponse = (situationId: string, candidateResponse: string, evaluation: 'GOOD' | 'AVERAGE' | 'BAD') => {
    setInterviewData(prev => ({
      ...prev,
      situations: prev.situations.map(s =>
        s.situationId === situationId ? { ...s, candidateResponse, evaluation } : s
      )
    }))
  }

  const submitInterview = async () => {
    if (!selectedCandidate) return
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}/candidates/${selectedCandidate.id}/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...interviewData,
          conductedBy: session?.user.firstName ? `${session.user.firstName} ${session.user.lastName}` : session?.user.username
        })
      })
      
      if (!response.ok) throw new Error('Erreur lors de la soumission')
      
      setShowInterviewModal(false)
      setSelectedCandidate(null)
      setInterviewData({
        questions: [],
        situations: [],
        additionalNotes: '',
        finalDecision: 'FAVORABLE'
      })
      await fetchCandidates()
    } catch (err) {
      setError('Impossible de soumettre l\'entretien')
    }
  }

  const canConductInterview = ['INSTRUCTEUR', 'SUPERVISEUR', 'DIRECTEUR', 'ADMIN'].includes(session?.user.role || '')

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: modernDesign.backgrounds.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          ...modernDesign.glass.card,
          padding: '48px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid transparent',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 24px'
          }}></div>
          <p style={modernDesign.typography.body}>Chargement des détails...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: modernDesign.backgrounds.primary
    }}>
      <ModernNavbar />
      
      <div style={{
        padding: '20px',
        paddingTop: '100px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div>
            <h1 style={{
              ...modernDesign.typography.title,
              fontSize: '32px',
              margin: '0 0 8px 0'
            }}>
              Détails de la Session
            </h1>
            {sessionData && (
              <h2 style={{
                ...modernDesign.typography.subtitle,
                fontSize: '24px',
                margin: '0'
              }}>
                {sessionData.name}
              </h2>
            )}
          </div>
          
          <button
            onClick={() => router.back()}
            style={{
              ...modernDesign.buttons.secondary,
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>←</span>
            <span>Retour</span>
          </button>
        </div>

        {error && (
          <div style={{
            ...modernDesign.glass.card,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '16px',
            marginBottom: '24px',
            color: '#fca5a5'
          }}>
            {error}
          </div>
        )}

        {/* Info de session */}
        {sessionData && (
          <div style={{
            ...modernDesign.glass.card,
            padding: '24px',
            marginBottom: '32px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px'
            }}>
              <div>
                <h4 style={{ ...modernDesign.typography.subtitle, fontSize: '16px', margin: '0 0 8px 0' }}>
                  📅 Date
                </h4>
                <p style={{ ...modernDesign.typography.body, margin: '0' }}>
                  {new Date(sessionData.date).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <h4 style={{ ...modernDesign.typography.subtitle, fontSize: '16px', margin: '0 0 8px 0' }}>
                  📍 Lieu
                </h4>
                <p style={{ ...modernDesign.typography.body, margin: '0' }}>
                  {sessionData.location}
                </p>
              </div>
              <div>
                <h4 style={{ ...modernDesign.typography.subtitle, fontSize: '16px', margin: '0 0 8px 0' }}>
                  👥 Candidats
                </h4>
                <p style={{ ...modernDesign.typography.body, margin: '0' }}>
                  {candidates.length} / {sessionData.maxCandidates}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Barre de recherche */}
        <div style={{
          ...modernDesign.glass.card,
          padding: '20px',
          marginBottom: '24px'
        }}>
          <input
            type="text"
            placeholder="Rechercher un candidat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              ...modernDesign.inputs.modern,
              width: '100%',
              fontSize: '16px'
            }}
          />
        </div>

        {/* Liste des candidats */}
        <div style={{
          display: 'grid',
          gap: '16px'
        }}>
          {filteredCandidates.map((candidate, index) => (
            <div
              key={candidate.id}
              style={{
                ...modernDesign.glass.card,
                padding: '24px',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '20px',
                alignItems: 'center'
              }}
            >
              <div>
                <h3 style={{
                  ...modernDesign.typography.subtitle,
                  fontSize: '18px',
                  margin: '0 0 8px 0'
                }}>
                  {candidate.firstName} {candidate.lastName}
                </h3>
                <p style={{
                  ...modernDesign.typography.body,
                  margin: '0 0 4px 0'
                }}>
                  {candidate.email}
                </p>
                <p style={{
                  ...modernDesign.typography.body,
                  fontSize: '12px',
                  opacity: 0.7,
                  margin: '0'
                }}>
                  Inscrit le {new Date(candidate.registeredAt).toLocaleDateString('fr-FR')}
                </p>
                
                {candidate.interview && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{
                      ...modernDesign.badges[
                        candidate.interview.status === 'COMPLETED' ? 'success' :
                        candidate.interview.status === 'IN_PROGRESS' ? 'warning' : 'info'
                      ],
                      fontSize: '12px',
                      marginBottom: '4px'
                    }}>
                      {candidate.interview.status === 'COMPLETED' ? 'Entretien terminé' :
                       candidate.interview.status === 'IN_PROGRESS' ? 'Entretien en cours' : 'Entretien planifié'}
                    </div>
                    {candidate.interview.conductedBy && (
                      <p style={{
                        ...modernDesign.typography.body,
                        fontSize: '12px',
                        margin: '0',
                        opacity: 0.8
                      }}>
                        Par: {candidate.interview.conductedBy}
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                minWidth: '200px'
              }}>
                {canConductInterview && (
                  <>
                    {!candidate.interview ? (
                      <button
                        onClick={() => startInterview(candidate)}
                        style={{
                          ...modernDesign.buttons.primary,
                          padding: '10px 16px',
                          fontSize: '14px'
                        }}
                      >
                        🎤 Prendre en charge l'entretien
                      </button>
                    ) : candidate.interview.status === 'COMPLETED' ? (
                      <>
                        <button
                          onClick={() => viewReport(candidate)}
                          style={{
                            ...modernDesign.buttons.secondary,
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#6ee7b7',
                            padding: '10px 16px',
                            fontSize: '14px'
                          }}
                        >
                          📄 Voir le compte-rendu
                        </button>
                        <button
                          onClick={() => unassignInterview(candidate)}
                          style={{
                            ...modernDesign.buttons.secondary,
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#fca5a5',
                            padding: '8px 12px',
                            fontSize: '12px'
                          }}
                        >
                          🗑️ Désaffecter
                        </button>
                      </>
                    ) : candidate.interview.status === 'IN_PROGRESS' && 
                        candidate.interview.conductedBy === `${session?.user.firstName} ${session?.user.lastName}` ? (
                      <>
                        <button
                          onClick={() => startInterview(candidate)}
                          style={{
                            ...modernDesign.buttons.primary,
                            padding: '10px 16px',
                            fontSize: '14px'
                          }}
                        >
                          🎤 Continuer l'entretien
                        </button>
                        <button
                          onClick={() => unassignInterview(candidate)}
                          style={{
                            ...modernDesign.buttons.secondary,
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#fca5a5',
                            padding: '8px 12px',
                            fontSize: '12px'
                          }}
                        >
                          🗑️ Désaffecter
                        </button>
                      </>
                    ) : candidate.interview.status === 'IN_PROGRESS' ? (
                      <div style={{
                        ...modernDesign.glass.card,
                        padding: '12px 16px',
                        textAlign: 'center',
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.3)'
                      }}>
                        <p style={{
                          ...modernDesign.typography.body,
                          fontSize: '12px',
                          margin: '0',
                          color: '#fbbf24'
                        }}>
                          🔒 Pris en charge par {candidate.interview.conductedBy}
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => startInterview(candidate)}
                        style={{
                          ...modernDesign.buttons.primary,
                          padding: '10px 16px',
                          fontSize: '14px'
                        }}
                      >
                        🎤 Prendre en charge l'entretien
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredCandidates.length === 0 && (
          <div style={{
            ...modernDesign.glass.card,
            padding: '48px',
            textAlign: 'center'
          }}>
            <p style={modernDesign.typography.body}>
              {searchTerm ? 'Aucun candidat trouvé pour cette recherche' : 'Aucun candidat inscrit à cette session'}
            </p>
          </div>
        )}
      </div>

      {/* Modal d'entretien */}
      {showInterviewModal && selectedCandidate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            ...modernDesign.glass.card,
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '32px'
          }}>
            {/* Header du modal */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              <h3 style={{
                ...modernDesign.typography.subtitle,
                fontSize: '24px',
                margin: '0'
              }}>
                Entretien - {selectedCandidate.firstName} {selectedCandidate.lastName}
              </h3>
              <button
                onClick={() => setShowInterviewModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Étapes de navigation */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '32px'
            }}>
              {[
                { key: 'questions', label: 'Questions', icon: '❓' },
                { key: 'situations', label: 'Situations', icon: '🎯' },
                { key: 'final', label: 'Finalisation', icon: '✅' }
              ].map(step => (
                <button
                  key={step.key}
                  onClick={() => setInterviewStep(step.key as any)}
                  style={{
                    ...(interviewStep === step.key ? modernDesign.buttons.primary : modernDesign.buttons.secondary),
                    padding: '8px 16px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>{step.icon}</span>
                  <span>{step.label}</span>
                </button>
              ))}
            </div>

            {/* Contenu de l'étape */}
            {interviewStep === 'questions' && (
              <div>
                <h4 style={{
                  ...modernDesign.typography.subtitle,
                  fontSize: '20px',
                  marginBottom: '24px'
                }}>
                  Questions d'entretien
                </h4>
                
                {interviewData.questions.map((q, index) => (
                  <div key={q.questionId} style={{
                    ...modernDesign.glass.card,
                    padding: '20px',
                    marginBottom: '16px'
                  }}>
                    <h5 style={{
                      ...modernDesign.typography.subtitle,
                      fontSize: '16px',
                      marginBottom: '12px'
                    }}>
                      {index + 1}. {q.question}
                    </h5>
                    
                    <textarea
                      placeholder="Réponse du candidat..."
                      value={q.answer}
                      onChange={(e) => updateQuestionAnswer(q.questionId, e.target.value, q.rating)}
                      style={{
                        ...modernDesign.inputs.modern,
                        width: '100%',
                        minHeight: '80px',
                        marginBottom: '12px',
                        resize: 'vertical'
                      }}
                    />
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <label style={{
                        ...modernDesign.typography.body,
                        fontWeight: '500'
                      }}>
                        Note :
                      </label>
                      <select
                        value={q.rating}
                        onChange={(e) => updateQuestionAnswer(q.questionId, q.answer, parseInt(e.target.value))}
                        style={{
                          ...modernDesign.inputs.modern,
                          padding: '8px 12px'
                        }}
                      >
                        <option value={1}>1 - Très insuffisant</option>
                        <option value={2}>2 - Insuffisant</option>
                        <option value={3}>3 - Passable</option>
                        <option value={4}>4 - Bien</option>
                        <option value={5}>5 - Très bien</option>
                      </select>
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={() => setInterviewStep('situations')}
                  style={{
                    ...modernDesign.buttons.primary,
                    padding: '12px 24px',
                    width: '100%'
                  }}
                >
                  Passer aux situations →
                </button>
              </div>
            )}

            {interviewStep === 'situations' && (
              <div>
                <h4 style={{
                  ...modernDesign.typography.subtitle,
                  fontSize: '20px',
                  marginBottom: '24px'
                }}>
                  Mises en situation
                </h4>
                
                {interviewData.situations.map((s, index) => (
                  <div key={s.situationId} style={{
                    ...modernDesign.glass.card,
                    padding: '20px',
                    marginBottom: '16px'
                  }}>
                    <h5 style={{
                      ...modernDesign.typography.subtitle,
                      fontSize: '16px',
                      marginBottom: '12px'
                    }}>
                      Situation {index + 1}: {s.title}
                    </h5>
                    
                    <div style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '12px'
                    }}>
                      <p style={{
                        ...modernDesign.typography.body,
                        margin: '0 0 8px 0',
                        fontWeight: '500'
                      }}>
                        Description :
                      </p>
                      <p style={{
                        ...modernDesign.typography.body,
                        margin: '0'
                      }}>
                        {s.description}
                      </p>
                    </div>
                    
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '12px'
                    }}>
                      <p style={{
                        ...modernDesign.typography.body,
                        margin: '0 0 8px 0',
                        fontWeight: '500'
                      }}>
                        Réponse attendue :
                      </p>
                      <p style={{
                        ...modernDesign.typography.body,
                        margin: '0'
                      }}>
                        {s.expectedResponse}
                      </p>
                    </div>
                    
                    <textarea
                      placeholder="Réponse du candidat..."
                      value={s.candidateResponse}
                      onChange={(e) => updateSituationResponse(s.situationId, e.target.value, s.evaluation)}
                      style={{
                        ...modernDesign.inputs.modern,
                        width: '100%',
                        minHeight: '80px',
                        marginBottom: '12px',
                        resize: 'vertical'
                      }}
                    />
                    
                    <div style={{
                      display: 'flex',
                      gap: '8px'
                    }}>
                      {[
                        { value: 'GOOD', label: 'Bonne réponse', color: '#22c55e' },
                        { value: 'AVERAGE', label: 'Réponse moyenne', color: '#f59e0b' },
                        { value: 'BAD', label: 'Mauvaise réponse', color: '#ef4444' }
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => updateSituationResponse(s.situationId, s.candidateResponse, option.value as any)}
                          style={{
                            ...modernDesign.buttons.secondary,
                            background: s.evaluation === option.value ? `rgba(${option.color === '#22c55e' ? '34, 197, 94' : option.color === '#f59e0b' ? '245, 158, 11' : '239, 68, 68'}, 0.2)` : 'transparent',
                            border: `1px solid ${option.color}`,
                            color: option.color,
                            padding: '8px 16px',
                            fontSize: '12px'
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={() => setInterviewStep('final')}
                  style={{
                    ...modernDesign.buttons.primary,
                    padding: '12px 24px',
                    width: '100%'
                  }}
                >
                  Finaliser l'entretien →
                </button>
              </div>
            )}

            {interviewStep === 'final' && (
              <div>
                <h4 style={{
                  ...modernDesign.typography.subtitle,
                  fontSize: '20px',
                  marginBottom: '24px'
                }}>
                  Finalisation de l'entretien
                </h4>
                
                <div style={{
                  ...modernDesign.glass.card,
                  padding: '20px',
                  marginBottom: '24px'
                }}>
                  <label style={{
                    ...modernDesign.typography.body,
                    fontWeight: '500',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    Notes supplémentaires :
                  </label>
                  <textarea
                    placeholder="Notes et observations supplémentaires..."
                    value={interviewData.additionalNotes}
                    onChange={(e) => setInterviewData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                    style={{
                      ...modernDesign.inputs.modern,
                      width: '100%',
                      minHeight: '100px',
                      resize: 'vertical'
                    }}
                  />
                </div>
                
                <div style={{
                  ...modernDesign.glass.card,
                  padding: '20px',
                  marginBottom: '24px'
                }}>
                  <label style={{
                    ...modernDesign.typography.body,
                    fontWeight: '500',
                    display: 'block',
                    marginBottom: '12px'
                  }}>
                    Décision finale :
                  </label>
                  <div style={{
                    display: 'flex',
                    gap: '12px'
                  }}>
                    {[
                      { value: 'FAVORABLE', label: 'Favorable', color: '#22c55e' },
                      { value: 'DEFAVORABLE', label: 'Défavorable', color: '#ef4444' },
                      { value: 'A_SURVEILLER', label: 'À surveiller', color: '#f59e0b' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setInterviewData(prev => ({ ...prev, finalDecision: option.value as any }))}
                        style={{
                          ...modernDesign.buttons.secondary,
                          background: interviewData.finalDecision === option.value ? `rgba(${option.color === '#22c55e' ? '34, 197, 94' : option.color === '#f59e0b' ? '245, 158, 11' : '239, 68, 68'}, 0.2)` : 'transparent',
                          border: `1px solid ${option.color}`,
                          color: option.color,
                          padding: '12px 20px',
                          fontSize: '14px',
                          flex: 1
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={submitInterview}
                  style={{
                    ...modernDesign.buttons.primary,
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    padding: '16px 24px',
                    width: '100%',
                    fontSize: '16px'
                  }}
                >
                  ✅ Terminer et soumettre l'entretien
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de compte-rendu */}
      {showReportModal && reportData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            ...modernDesign.glass.card,
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '32px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              <h3 style={{
                ...modernDesign.typography.subtitle,
                fontSize: '24px',
                margin: '0'
              }}>
                Compte-rendu d'entretien
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Affichage du compte-rendu complet */}
            <div style={{
              display: 'grid',
              gap: '24px'
            }}>
              {/* Questions */}
              <div>
                <h4 style={{
                  ...modernDesign.typography.subtitle,
                  fontSize: '18px',
                  marginBottom: '16px'
                }}>
                  Questions d'entretien
                </h4>
                {reportData.questions?.map((q: any, index: number) => (
                  <div key={index} style={{
                    ...modernDesign.glass.light,
                    padding: '16px',
                    marginBottom: '12px'
                  }}>
                    <p style={{
                      ...modernDesign.typography.body,
                      fontWeight: '500',
                      margin: '0 0 8px 0'
                    }}>
                      {q.question}
                    </p>
                    <p style={{
                      ...modernDesign.typography.body,
                      margin: '0 0 8px 0'
                    }}>
                      {q.answer}
                    </p>
                    <div style={{
                      ...modernDesign.badges.info,
                      fontSize: '12px'
                    }}>
                      Note: {q.rating}/5
                    </div>
                  </div>
                ))}
              </div>

              {/* Situations */}
              <div>
                <h4 style={{
                  ...modernDesign.typography.subtitle,
                  fontSize: '18px',
                  marginBottom: '16px'
                }}>
                  Mises en situation
                </h4>
                {reportData.situations?.map((s: any, index: number) => (
                  <div key={index} style={{
                    ...modernDesign.glass.light,
                    padding: '16px',
                    marginBottom: '12px'
                  }}>
                    <p style={{
                      ...modernDesign.typography.body,
                      fontWeight: '500',
                      margin: '0 0 8px 0'
                    }}>
                      {s.title}
                    </p>
                    <p style={{
                      ...modernDesign.typography.body,
                      margin: '0 0 8px 0'
                    }}>
                      Réponse: {s.candidateResponse}
                    </p>
                    <div style={{
                      ...modernDesign.badges[
                        s.evaluation === 'GOOD' ? 'success' :
                        s.evaluation === 'AVERAGE' ? 'warning' : 'error'
                      ],
                      fontSize: '12px'
                    }}>
                      {s.evaluation === 'GOOD' ? 'Bonne réponse' :
                       s.evaluation === 'AVERAGE' ? 'Réponse moyenne' : 'Mauvaise réponse'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes et décision */}
              <div>
                <h4 style={{
                  ...modernDesign.typography.subtitle,
                  fontSize: '18px',
                  marginBottom: '16px'
                }}>
                  Notes et décision finale
                </h4>
                <div style={{
                  ...modernDesign.glass.light,
                  padding: '16px'
                }}>
                  {reportData.additionalNotes && (
                    <p style={{
                      ...modernDesign.typography.body,
                      margin: '0 0 12px 0'
                    }}>
                      <strong>Notes:</strong> {reportData.additionalNotes}
                    </p>
                  )}
                  <div style={{
                    ...modernDesign.badges[
                      reportData.finalDecision === 'FAVORABLE' ? 'success' :
                      reportData.finalDecision === 'A_SURVEILLER' ? 'warning' : 'error'
                    ],
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    Décision: {
                      reportData.finalDecision === 'FAVORABLE' ? 'Favorable' :
                      reportData.finalDecision === 'A_SURVEILLER' ? 'À surveiller' : 'Défavorable'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
