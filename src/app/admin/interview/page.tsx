'use client'

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { modernDesign } from "@/utils/modernDesign"

interface InterviewQuestion {
  id: string
  question: string
  category: string
}

interface Situation {
  id: string
  title: string
  description: string
  situation: string
}

interface InterviewAnswer {
  questionId: string
  answer: string
  rating: 'excellent' | 'good' | 'average' | 'poor'
}

interface SituationAnswer {
  situationId: string
  answer: string
  rating: 'excellent' | 'good' | 'average' | 'poor'
}

interface Interview {
  id: string
  candidateId: string
  conductedBy: string
  conductedByName?: string
  status: 'pending' | 'in_progress' | 'completed'
  startedAt?: string
  completedAt?: string
  questions: InterviewAnswer[]
  situations: SituationAnswer[]
  notes?: string
  overallRating?: 'excellent' | 'good' | 'average' | 'poor'
  createdAt: string
  updatedAt: string
}

interface Candidate {
  id: string
  userId: string
  matricule: string
  status: string
  user: {
    id: string
    username: string
    email: string
    firstName?: string
    lastName?: string
  }
}

export default function InterviewPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const candidateId = searchParams.get('candidateId')
  const sessionId = searchParams.get('sessionId')
  const interviewId = searchParams.get('interviewId')
  const mode = searchParams.get('mode') // 'conduct' ou 'view'

  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [interview, setInterview] = useState<Interview | null>(null)
  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [situations, setSituations] = useState<Situation[]>([])
  const [currentStep, setCurrentStep] = useState<'questions' | 'situations' | 'summary'>('questions')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentSituationIndex, setCurrentSituationIndex] = useState(0)
  const [answers, setAnswers] = useState<InterviewAnswer[]>([])
  const [situationAnswers, setSituationAnswers] = useState<SituationAnswer[]>([])
  const [notes, setNotes] = useState('')
  const [overallRating, setOverallRating] = useState<'excellent' | 'good' | 'average' | 'poor'>('good')
  const [loading, setLoading] = useState(true)

  // Styles pour les animations
  const styles = (
    <style jsx>{`
      @keyframes modernFadeIn {
        0% { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes modernSlideIn {
        0% { opacity: 0; transform: translateX(-20px); }
        100% { opacity: 1; transform: translateX(0); }
      }
      
      @keyframes modernScale {
        0% { opacity: 0; transform: scale(0.95); }
        100% { opacity: 1; transform: scale(1); }
      }
      
      @keyframes modernPulse {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
      }
    `}</style>
  )

  useEffect(() => {
    if (!candidateId || !sessionId) {
      router.push('/admin/dashboard?tab=sessions')
      return
    }
    
    fetchCandidateAndInterview()
    fetchQuestions()
    fetchSituations()
  }, [candidateId, sessionId, interviewId])

  const fetchCandidateAndInterview = async () => {
    try {
      // Récupérer les informations du candidat
      const candidateResponse = await fetch(`/api/sessions/${sessionId}/candidates/${candidateId}`)
      if (candidateResponse.ok) {
        const candidateData = await candidateResponse.json()
        setCandidate(candidateData.candidate)
      }

      // Récupérer l'entretien existant si interviewId est fourni
      if (interviewId) {
        const interviewResponse = await fetch(`/api/interviews/${interviewId}`)
        if (interviewResponse.ok) {
          const interviewData = await interviewResponse.json()
          setInterview(interviewData.interview)
          
          if (mode === 'view') {
            // Mode visualisation - charger les données existantes
            setAnswers(interviewData.interview.questions || [])
            setSituationAnswers(interviewData.interview.situations || [])
            setNotes(interviewData.interview.notes || '')
            setOverallRating(interviewData.interview.overallRating || 'good')
            setCurrentStep('summary')
          } else {
            // Mode conduite - reprendre où on en était
            setAnswers(interviewData.interview.questions || [])
            setSituationAnswers(interviewData.interview.situations || [])
            
            if (interviewData.interview.questions?.length > 0 && !interviewData.interview.situations?.length) {
              setCurrentStep('situations')
            }
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/interview-questions')
      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des questions:', error)
    }
  }

  const fetchSituations = async () => {
    try {
      const response = await fetch('/api/situations')
      if (response.ok) {
        const data = await response.json()
        setSituations(data.situations || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des situations:', error)
    }
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionId)
      if (existing) {
        return prev.map(a => a.questionId === questionId ? { ...a, answer } : a)
      } else {
        return [...prev, { questionId, answer, rating: 'good' }]
      }
    })
  }

  const handleRatingChange = (questionId: string, rating: 'excellent' | 'good' | 'average' | 'poor') => {
    setAnswers(prev => 
      prev.map(a => a.questionId === questionId ? { ...a, rating } : a)
    )
  }

  const handleSituationAnswerChange = (situationId: string, answer: string) => {
    setSituationAnswers(prev => {
      const existing = prev.find(a => a.situationId === situationId)
      if (existing) {
        return prev.map(a => a.situationId === situationId ? { ...a, answer } : a)
      } else {
        return [...prev, { situationId, answer, rating: 'good' }]
      }
    })
  }

  const handleSituationRatingChange = (situationId: string, rating: 'excellent' | 'good' | 'average' | 'poor') => {
    setSituationAnswers(prev => 
      prev.map(a => a.situationId === situationId ? { ...a, rating } : a)
    )
  }

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      setCurrentStep('situations')
      setCurrentSituationIndex(0)
    }
  }

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const goToNextSituation = () => {
    if (currentSituationIndex < situations.length - 1) {
      setCurrentSituationIndex(prev => prev + 1)
    } else {
      setCurrentStep('summary')
    }
  }

  const goToPreviousSituation = () => {
    if (currentSituationIndex > 0) {
      setCurrentSituationIndex(prev => prev - 1)
    } else {
      setCurrentStep('questions')
      setCurrentQuestionIndex(questions.length - 1)
    }
  }

  const saveInterview = async () => {
    try {
      const interviewData = {
        candidateId,
        sessionId,
        questions: answers,
        situations: situationAnswers,
        notes,
        overallRating,
        status: currentStep === 'summary' ? 'completed' : 'in_progress',
        conductedBy: session?.user?.id
      }

      const url = interview ? `/api/interviews/${interview.id}` : '/api/interviews'
      const method = interview ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interviewData)
      })

      if (response.ok) {
        const data = await response.json()
        setInterview(data.interview)
        
        if (currentStep === 'summary') {
          alert('Entretien sauvegardé avec succès!')
          router.push(`/admin/dashboard?tab=sessions`)
        }
      } else {
        alert('Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return '#10b981'
      case 'good': return '#3b82f6'
      case 'average': return '#f59e0b'
      case 'poor': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getRatingLabel = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'Excellente réponse'
      case 'good': return 'Bonne réponse'
      case 'average': return 'Réponse moyenne'
      case 'poor': return 'Mauvaise réponse'
      default: return 'Non évalué'
    }
  }

  if (loading) {
    return (
      <>
        {styles}
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
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
              animation: 'modernPulse 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <p style={{...modernDesign.typography.body, color: '#d1d5db'}}>
              Chargement de l'entretien...
            </p>
          </div>
        </div>
      </>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const currentSituation = situations[currentSituationIndex]
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?.id)
  const currentSituationAnswer = situationAnswers.find(a => a.situationId === currentSituation?.id)

  return (
    <>
      {styles}
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        padding: '24px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Header */}
          <div style={{
            ...modernDesign.glass.card,
            padding: '24px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h1 style={{
                ...modernDesign.typography.title,
                margin: '0 0 8px 0',
                fontSize: '24px'
              }}>
                {mode === 'view' ? '📋 Compte-rendu d\'entretien' : '🎤 Entretien en cours'}
              </h1>
              <p style={{
                ...modernDesign.typography.body,
                margin: '0',
                color: '#9ca3af'
              }}>
                Candidat: {candidate?.user.firstName} {candidate?.user.lastName} ({candidate?.user.email})
              </p>
            </div>
            
            <button
              onClick={() => router.push(`/admin/dashboard?tab=sessions`)}
              style={{
                ...modernDesign.buttons.secondary,
                padding: '8px 16px'
              }}
            >
              ← Retour
            </button>
          </div>

          {/* Progress Bar */}
          {mode !== 'view' && (
            <div style={{
              ...modernDesign.glass.card,
              padding: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{
                  ...modernDesign.typography.body,
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  Progression de l'entretien
                </span>
                <span style={{
                  ...modernDesign.typography.body,
                  fontSize: '14px',
                  color: '#9ca3af'
                }}>
                  {currentStep === 'questions' && `Question ${currentQuestionIndex + 1}/${questions.length}`}
                  {currentStep === 'situations' && `Situation ${currentSituationIndex + 1}/${situations.length}`}
                  {currentStep === 'summary' && 'Résumé final'}
                </span>
              </div>
              
              <div style={{
                width: '100%',
                height: '8px',
                background: 'rgba(59, 130, 246, 0.2)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                  borderRadius: '4px',
                  width: currentStep === 'questions' 
                    ? `${((currentQuestionIndex + 1) / questions.length) * 50}%`
                    : currentStep === 'situations'
                    ? `${50 + ((currentSituationIndex + 1) / situations.length) * 40}%`
                    : '100%',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>
          )}

          {/* Questions Step */}
          {currentStep === 'questions' && currentQuestion && mode !== 'view' && (
            <div style={{
              ...modernDesign.glass.card,
              padding: '32px',
              animation: 'modernFadeIn 0.5s ease-out'
            }}>
              <div style={{
                marginBottom: '24px'
              }}>
                <h2 style={{
                  ...modernDesign.typography.subtitle,
                  margin: '0 0 8px 0',
                  color: '#3b82f6'
                }}>
                  Question {currentQuestionIndex + 1}
                </h2>
                <p style={{
                  ...modernDesign.typography.body,
                  fontSize: '18px',
                  lineHeight: '1.6',
                  margin: '0'
                }}>
                  {currentQuestion.question}
                </p>
              </div>

              <div style={{
                marginBottom: '24px'
              }}>
                <label style={{
                  ...modernDesign.typography.body,
                  fontWeight: '600',
                  marginBottom: '8px',
                  display: 'block'
                }}>
                  Réponse du candidat:
                </label>
                <textarea
                  value={currentAnswer?.answer || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  style={{
                    ...modernDesign.inputs.modern,
                    minHeight: '120px',
                    resize: 'vertical'
                  }}
                  placeholder="Saisissez la réponse du candidat..."
                />
              </div>

              <div style={{
                marginBottom: '32px'
              }}>
                <label style={{
                  ...modernDesign.typography.body,
                  fontWeight: '600',
                  marginBottom: '12px',
                  display: 'block'
                }}>
                  Évaluation:
                </label>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  {[
                    { value: 'excellent', label: 'Excellente', color: '#10b981' },
                    { value: 'good', label: 'Bonne', color: '#3b82f6' },
                    { value: 'average', label: 'Moyenne', color: '#f59e0b' },
                    { value: 'poor', label: 'Mauvaise', color: '#ef4444' }
                  ].map(rating => (
                    <button
                      key={rating.value}
                      onClick={() => handleRatingChange(currentQuestion.id, rating.value as any)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: currentAnswer?.rating === rating.value 
                          ? `2px solid ${rating.color}` 
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        background: currentAnswer?.rating === rating.value 
                          ? `${rating.color}20` 
                          : 'transparent',
                        color: currentAnswer?.rating === rating.value 
                          ? rating.color 
                          : '#d1d5db',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      {rating.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '16px'
              }}>
                <button
                  onClick={goToPreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  style={{
                    ...modernDesign.buttons.secondary,
                    opacity: currentQuestionIndex === 0 ? 0.5 : 1,
                    cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ← Précédent
                </button>
                
                <button
                  onClick={saveInterview}
                  style={{
                    ...modernDesign.buttons.secondary,
                    background: 'rgba(139, 92, 246, 0.2)',
                    color: '#a855f7'
                  }}
                >
                  💾 Sauvegarder
                </button>
                
                <button
                  onClick={goToNextQuestion}
                  style={{
                    ...modernDesign.buttons.primary
                  }}
                >
                  {currentQuestionIndex === questions.length - 1 ? 'Passer aux situations →' : 'Suivant →'}
                </button>
              </div>
            </div>
          )}

          {/* Situations Step */}
          {currentStep === 'situations' && currentSituation && mode !== 'view' && (
            <div style={{
              ...modernDesign.glass.card,
              padding: '32px',
              animation: 'modernFadeIn 0.5s ease-out'
            }}>
              <div style={{
                marginBottom: '24px'
              }}>
                <h2 style={{
                  ...modernDesign.typography.subtitle,
                  margin: '0 0 12px 0',
                  color: '#8b5cf6'
                }}>
                  Situation {currentSituationIndex + 1}: {currentSituation.title}
                </h2>
                <div style={{
                  ...modernDesign.glass.card,
                  padding: '20px',
                  marginBottom: '16px',
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}>
                  <p style={{
                    ...modernDesign.typography.body,
                    fontSize: '16px',
                    lineHeight: '1.6',
                    margin: '0 0 12px 0',
                    fontWeight: '600'
                  }}>
                    {currentSituation.description}
                  </p>
                  <p style={{
                    ...modernDesign.typography.body,
                    fontSize: '16px',
                    lineHeight: '1.6',
                    margin: '0',
                    fontStyle: 'italic'
                  }}>
                    {currentSituation.situation}
                  </p>
                </div>
              </div>

              <div style={{
                marginBottom: '24px'
              }}>
                <label style={{
                  ...modernDesign.typography.body,
                  fontWeight: '600',
                  marginBottom: '8px',
                  display: 'block'
                }}>
                  Réponse du candidat:
                </label>
                <textarea
                  value={currentSituationAnswer?.answer || ''}
                  onChange={(e) => handleSituationAnswerChange(currentSituation.id, e.target.value)}
                  style={{
                    ...modernDesign.inputs.modern,
                    minHeight: '120px',
                    resize: 'vertical'
                  }}
                  placeholder="Saisissez la réponse du candidat à cette mise en situation..."
                />
              </div>

              <div style={{
                marginBottom: '32px'
              }}>
                <label style={{
                  ...modernDesign.typography.body,
                  fontWeight: '600',
                  marginBottom: '12px',
                  display: 'block'
                }}>
                  Évaluation:
                </label>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  {[
                    { value: 'excellent', label: 'Excellente', color: '#10b981' },
                    { value: 'good', label: 'Bonne', color: '#3b82f6' },
                    { value: 'average', label: 'Moyenne', color: '#f59e0b' },
                    { value: 'poor', label: 'Mauvaise', color: '#ef4444' }
                  ].map(rating => (
                    <button
                      key={rating.value}
                      onClick={() => handleSituationRatingChange(currentSituation.id, rating.value as any)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: currentSituationAnswer?.rating === rating.value 
                          ? `2px solid ${rating.color}` 
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        background: currentSituationAnswer?.rating === rating.value 
                          ? `${rating.color}20` 
                          : 'transparent',
                        color: currentSituationAnswer?.rating === rating.value 
                          ? rating.color 
                          : '#d1d5db',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      {rating.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '16px'
              }}>
                <button
                  onClick={goToPreviousSituation}
                  style={{
                    ...modernDesign.buttons.secondary
                  }}
                >
                  ← Précédent
                </button>
                
                <button
                  onClick={saveInterview}
                  style={{
                    ...modernDesign.buttons.secondary,
                    background: 'rgba(139, 92, 246, 0.2)',
                    color: '#a855f7'
                  }}
                >
                  💾 Sauvegarder
                </button>
                
                <button
                  onClick={goToNextSituation}
                  style={{
                    ...modernDesign.buttons.primary
                  }}
                >
                  {currentSituationIndex === situations.length - 1 ? 'Terminer l\'entretien →' : 'Suivant →'}
                </button>
              </div>
            </div>
          )}

          {/* Summary Step - Mode conduite et visualisation */}
          {currentStep === 'summary' && (
            <div style={{
              animation: 'modernFadeIn 0.5s ease-out'
            }}>
              {/* Notes globales */}
              {mode !== 'view' && (
                <div style={{
                  ...modernDesign.glass.card,
                  padding: '32px',
                  marginBottom: '24px'
                }}>
                  <h2 style={{
                    ...modernDesign.typography.subtitle,
                    margin: '0 0 16px 0'
                  }}>
                    📝 Notes et évaluation globale
                  </h2>
                  
                  <div style={{
                    marginBottom: '24px'
                  }}>
                    <label style={{
                      ...modernDesign.typography.body,
                      fontWeight: '600',
                      marginBottom: '8px',
                      display: 'block'
                    }}>
                      Notes générales:
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      style={{
                        ...modernDesign.inputs.modern,
                        minHeight: '100px',
                        resize: 'vertical'
                      }}
                      placeholder="Ajoutez vos observations générales sur l'entretien..."
                    />
                  </div>

                  <div style={{
                    marginBottom: '32px'
                  }}>
                    <label style={{
                      ...modernDesign.typography.body,
                      fontWeight: '600',
                      marginBottom: '12px',
                      display: 'block'
                    }}>
                      Évaluation globale:
                    </label>
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}>
                      {[
                        { value: 'excellent', label: 'Excellent candidat', color: '#10b981' },
                        { value: 'good', label: 'Bon candidat', color: '#3b82f6' },
                        { value: 'average', label: 'Candidat moyen', color: '#f59e0b' },
                        { value: 'poor', label: 'Candidat faible', color: '#ef4444' }
                      ].map(rating => (
                        <button
                          key={rating.value}
                          onClick={() => setOverallRating(rating.value as any)}
                          style={{
                            padding: '12px 20px',
                            borderRadius: '8px',
                            border: overallRating === rating.value 
                              ? `2px solid ${rating.color}` 
                              : '1px solid rgba(255, 255, 255, 0.1)',
                            background: overallRating === rating.value 
                              ? `${rating.color}20` 
                              : 'transparent',
                            color: overallRating === rating.value 
                              ? rating.color 
                              : '#d1d5db',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}
                        >
                          {rating.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={saveInterview}
                    style={{
                      ...modernDesign.buttons.primary,
                      padding: '16px 32px',
                      fontSize: '16px'
                    }}
                  >
                    ✅ Finaliser l'entretien
                  </button>
                </div>
              )}

              {/* Résumé des réponses */}
              <div style={{
                display: 'grid',
                gap: '24px'
              }}>
                {/* Questions */}
                {answers.length > 0 && (
                  <div style={{
                    ...modernDesign.glass.card,
                    padding: '32px'
                  }}>
                    <h3 style={{
                      ...modernDesign.typography.subtitle,
                      margin: '0 0 24px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      ❓ Questions d'entretien
                    </h3>
                    
                    <div style={{
                      display: 'grid',
                      gap: '20px'
                    }}>
                      {answers.map((answer, index) => {
                        const question = questions.find(q => q.id === answer.questionId)
                        if (!question) return null
                        
                        return (
                          <div
                            key={answer.questionId}
                            style={{
                              ...modernDesign.glass.card,
                              padding: '20px',
                              border: `1px solid ${getRatingColor(answer.rating)}40`,
                              background: `${getRatingColor(answer.rating)}08`
                            }}
                          >
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              marginBottom: '12px'
                            }}>
                              <h4 style={{
                                ...modernDesign.typography.body,
                                fontWeight: '600',
                                margin: '0',
                                flex: 1
                              }}>
                                Q{index + 1}: {question.question}
                              </h4>
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: '12px',
                                background: getRatingColor(answer.rating),
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: '600',
                                whiteSpace: 'nowrap',
                                marginLeft: '16px'
                              }}>
                                {getRatingLabel(answer.rating)}
                              </span>
                            </div>
                            <p style={{
                              ...modernDesign.typography.body,
                              margin: '0',
                              color: '#d1d5db',
                              fontStyle: 'italic'
                            }}>
                              {answer.answer}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Situations */}
                {situationAnswers.length > 0 && (
                  <div style={{
                    ...modernDesign.glass.card,
                    padding: '32px'
                  }}>
                    <h3 style={{
                      ...modernDesign.typography.subtitle,
                      margin: '0 0 24px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      🎯 Mises en situation
                    </h3>
                    
                    <div style={{
                      display: 'grid',
                      gap: '20px'
                    }}>
                      {situationAnswers.map((answer, index) => {
                        const situation = situations.find(s => s.id === answer.situationId)
                        if (!situation) return null
                        
                        return (
                          <div
                            key={answer.situationId}
                            style={{
                              ...modernDesign.glass.card,
                              padding: '20px',
                              border: `1px solid ${getRatingColor(answer.rating)}40`,
                              background: `${getRatingColor(answer.rating)}08`
                            }}
                          >
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              marginBottom: '12px'
                            }}>
                              <h4 style={{
                                ...modernDesign.typography.body,
                                fontWeight: '600',
                                margin: '0 0 8px 0',
                                flex: 1
                              }}>
                                S{index + 1}: {situation.title}
                              </h4>
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: '12px',
                                background: getRatingColor(answer.rating),
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: '600',
                                whiteSpace: 'nowrap',
                                marginLeft: '16px'
                              }}>
                                {getRatingLabel(answer.rating)}
                              </span>
                            </div>
                            <p style={{
                              ...modernDesign.typography.body,
                              margin: '0 0 12px 0',
                              color: '#9ca3af',
                              fontSize: '14px'
                            }}>
                              {situation.situation}
                            </p>
                            <p style={{
                              ...modernDesign.typography.body,
                              margin: '0',
                              color: '#d1d5db',
                              fontStyle: 'italic'
                            }}>
                              {answer.answer}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Notes et évaluation globale en mode visualisation */}
                {mode === 'view' && interview && (
                  <div style={{
                    ...modernDesign.glass.card,
                    padding: '32px'
                  }}>
                    <h3 style={{
                      ...modernDesign.typography.subtitle,
                      margin: '0 0 24px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      📋 Évaluation finale
                    </h3>
                    
                    <div style={{
                      display: 'grid',
                      gap: '20px'
                    }}>
                      <div>
                        <label style={{
                          ...modernDesign.typography.body,
                          fontWeight: '600',
                          marginBottom: '8px',
                          display: 'block'
                        }}>
                          Entretien conduit par:
                        </label>
                        <p style={{
                          ...modernDesign.typography.body,
                          margin: '0',
                          color: '#d1d5db'
                        }}>
                          {interview.conductedByName || 'Instructeur'}
                        </p>
                      </div>
                      
                      <div>
                        <label style={{
                          ...modernDesign.typography.body,
                          fontWeight: '600',
                          marginBottom: '8px',
                          display: 'block'
                        }}>
                          Date de réalisation:
                        </label>
                        <p style={{
                          ...modernDesign.typography.body,
                          margin: '0',
                          color: '#d1d5db'
                        }}>
                          {interview.completedAt ? new Date(interview.completedAt).toLocaleString('fr-FR') : 'En cours'}
                        </p>
                      </div>
                      
                      {interview.overallRating && (
                        <div>
                          <label style={{
                            ...modernDesign.typography.body,
                            fontWeight: '600',
                            marginBottom: '8px',
                            display: 'block'
                          }}>
                            Évaluation globale:
                          </label>
                          <span style={{
                            padding: '8px 16px',
                            borderRadius: '12px',
                            background: getRatingColor(interview.overallRating),
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}>
                            {getRatingLabel(interview.overallRating)}
                          </span>
                        </div>
                      )}
                      
                      {interview.notes && (
                        <div>
                          <label style={{
                            ...modernDesign.typography.body,
                            fontWeight: '600',
                            marginBottom: '8px',
                            display: 'block'
                          }}>
                            Notes:
                          </label>
                          <p style={{
                            ...modernDesign.typography.body,
                            margin: '0',
                            color: '#d1d5db',
                            fontStyle: 'italic',
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: '16px',
                            borderRadius: '8px'
                          }}>
                            {interview.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
