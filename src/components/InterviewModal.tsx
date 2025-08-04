'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { X, ChevronRight, ChevronLeft, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

interface Question {
  id: string
  question: string
  category: string
}

interface Situation {
  id: string
  title: string
  description: string
  expectedBehavior?: string
  expectedResponse?: string
  correctAnswer?: string
  difficulty?: string
  category?: string
}

interface QuestionAnswer {
  questionId: string
  answer: string
}

interface SituationAnswer {
  situationId: string
  candidateAnswer: string
  rating: 'MAUVAISE' | 'MOYENNE' | 'BONNE'
}

interface InterviewModalProps {
  isOpen: boolean
  onClose: () => void
  candidateId: string
  candidateName: string
  sessionId: string
  onComplete: () => void
}

export default function InterviewModal({ 
  isOpen, 
  onClose, 
  candidateId, 
  candidateName, 
  sessionId, 
  onComplete 
}: InterviewModalProps) {
  const { data: session } = useSession()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [situations, setSituations] = useState<Situation[]>([])
  
  // Réponses
  const [questionAnswers, setQuestionAnswers] = useState<QuestionAnswer[]>([])
  const [situationAnswers, setSituationAnswers] = useState<SituationAnswer[]>([])
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [finalDecision, setFinalDecision] = useState<'FAVORABLE' | 'DEFAVORABLE' | 'A_SURVEILLER'>('FAVORABLE')

  useEffect(() => {
    if (isOpen) {
      fetchInterviewData()
      startInterview()
    }
  }, [isOpen])

  const fetchInterviewData = async () => {
    try {
      // Récupérer les questions d'entretien
      const questionsResponse = await fetch('/api/interview-questions')
      if (questionsResponse.ok) {
        const questionsData = await questionsResponse.json()
        setQuestions(questionsData)
        setQuestionAnswers(questionsData.map((q: Question) => ({ questionId: q.id, answer: '' })))
      }

      // Récupérer 3 situations aléatoires
      const situationsResponse = await fetch('/api/situations?random=3')
      if (situationsResponse.ok) {
        const situationsData = await situationsResponse.json()
        const randomSituations = situationsData || []
        setSituations(randomSituations)
        setSituationAnswers(randomSituations.map((s: Situation) => ({ 
          situationId: s.id, 
          candidateAnswer: '', 
          rating: 'MOYENNE' as const 
        })))
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    }
  }

  const startInterview = async () => {
    try {
      await fetch(`/api/sessions/${sessionId}/candidates/${candidateId}/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'IN_PROGRESS',
          conductedBy: `${session?.user?.firstName || ''} ${session?.user?.lastName || ''}`.trim() || session?.user?.username
        })
      })
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'entretien:', error)
    }
  }

  const updateQuestionAnswer = (questionId: string, answer: string) => {
    setQuestionAnswers(prev => 
      prev.map(qa => qa.questionId === questionId ? { ...qa, answer } : qa)
    )
  }

  const updateSituationAnswer = (situationId: string, candidateAnswer: string, rating: 'MAUVAISE' | 'MOYENNE' | 'BONNE') => {
    setSituationAnswers(prev => 
      prev.map(sa => sa.situationId === situationId ? { ...sa, candidateAnswer, rating } : sa)
    )
  }

  const completeInterview = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/sessions/${sessionId}/candidates/${candidateId}/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          finalDecision,
          additionalNotes,
          questions: questionAnswers,
          situations: situationAnswers
        })
      })

      if (response.ok) {
        onComplete()
        onClose()
      } else {
        alert('Erreur lors de la finalisation de l\'entretien')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la finalisation de l\'entretien')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'FAVORABLE': return <CheckCircle style={{ width: '16px', height: '16px', color: '#22c55e' }} />
      case 'A_SURVEILLER': return <AlertTriangle style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
      case 'DEFAVORABLE': return <XCircle style={{ width: '16px', height: '16px', color: '#ef4444' }} />
      default: return null
    }
  }

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'FAVORABLE': return '#22c55e'
      case 'A_SURVEILLER': return '#f59e0b'
      case 'DEFAVORABLE': return '#ef4444'
      default: return '#6b7280'
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        background: 'rgba(17, 24, 39, 0.95)',
        borderRadius: '20px',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(75, 85, 99, 0.3)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid rgba(75, 85, 99, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 4px 0'
            }}>
              Entretien - {candidateName}
            </h2>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: '14px',
              color: '#9ca3af'
            }}>
              <span>Étape {currentStep}/3</span>
              <span>•</span>
              <span>Instructeur: {session?.user?.username}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(75, 85, 99, 0.2)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              color: '#9ca3af',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
              e.currentTarget.style.color = '#ef4444'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(75, 85, 99, 0.2)'
              e.currentTarget.style.color = '#9ca3af'
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{
          padding: '0 32px',
          background: 'rgba(31, 41, 55, 0.5)'
        }}>
          <div style={{
            display: 'flex',
            height: '4px',
            background: 'rgba(75, 85, 99, 0.3)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(currentStep / 3) * 100}%`,
              background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          padding: '32px',
          overflowY: 'auto'
        }}>
          {/* Étape 1: Questions */}
          {currentStep === 1 && (
            <div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: 'white',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}>
                  1
                </span>
                Questions d'entretien
              </h3>
              <p style={{ color: '#9ca3af', marginBottom: '32px' }}>
                Posez les questions suivantes au candidat et notez ses réponses.
              </p>

              <div style={{ display: 'grid', gap: '24px' }}>
                {questions.map((question, index) => (
                  <div key={question.id} style={{
                    background: 'rgba(31, 41, 55, 0.6)',
                    border: '1px solid rgba(75, 85, 99, 0.3)',
                    borderRadius: '12px',
                    padding: '24px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px',
                      marginBottom: '16px'
                    }}>
                      <span style={{
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: '#3b82f6',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        Q{index + 1}
                      </span>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: 'white', fontSize: '16px', fontWeight: '500', margin: '0 0 8px 0' }}>
                          {question.question}
                        </p>
                        <span style={{
                          background: 'rgba(156, 163, 175, 0.1)',
                          color: '#9ca3af',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          {question.category}
                        </span>
                      </div>
                    </div>
                    
                    <textarea
                      value={questionAnswers.find(qa => qa.questionId === question.id)?.answer || ''}
                      onChange={(e) => updateQuestionAnswer(question.id, e.target.value)}
                      placeholder="Notez la réponse du candidat..."
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(75, 85, 99, 0.3)',
                        borderRadius: '8px',
                        padding: '12px',
                        color: 'white',
                        fontSize: '14px',
                        resize: 'vertical',
                        outline: 'none'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Étape 2: Mises en situation */}
          {currentStep === 2 && (
            <div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: 'white',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}>
                  2
                </span>
                Mises en situation
              </h3>
              <p style={{ color: '#9ca3af', marginBottom: '32px' }}>
                Présentez les situations suivantes au candidat et évaluez ses réponses.
              </p>

              <div style={{ display: 'grid', gap: '32px' }}>
                {situations.map((situation, index) => (
                  <div key={situation.id} style={{
                    background: 'rgba(31, 41, 55, 0.6)',
                    border: '1px solid rgba(75, 85, 99, 0.3)',
                    borderRadius: '12px',
                    padding: '24px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px',
                      marginBottom: '20px'
                    }}>
                      <span style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        S{index + 1}
                      </span>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: '0 0 12px 0' }}>
                          {situation.title}
                        </h4>
                        <p style={{ color: '#e5e7eb', fontSize: '14px', margin: '0 0 16px 0', lineHeight: '1.6' }}>
                          {situation.description}
                        </p>
                        <div style={{
                          background: 'rgba(59, 130, 246, 0.05)',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          borderRadius: '8px',
                          padding: '16px',
                          marginBottom: '16px'
                        }}>
                          <p style={{ color: '#93c5fd', fontSize: '14px', fontWeight: '500', margin: '0 0 8px 0' }}>
                            Situation à présenter :
                          </p>
                          <p style={{ color: 'white', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
                            {situation.description}
                          </p>
                        </div>
                        <div style={{
                          background: 'rgba(34, 197, 94, 0.05)',
                          border: '1px solid rgba(34, 197, 94, 0.2)',
                          borderRadius: '8px',
                          padding: '16px'
                        }}>
                          <p style={{ color: '#86efac', fontSize: '14px', fontWeight: '500', margin: '0 0 8px 0' }}>
                            Réponse attendue :
                          </p>
                          <p style={{ color: '#e5e7eb', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
                            {situation.expectedResponse || situation.expectedBehavior || situation.correctAnswer || 'Réponse attendue non définie'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ color: 'white', fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                        Réponse du candidat :
                      </label>
                      <textarea
                        value={situationAnswers.find(sa => sa.situationId === situation.id)?.candidateAnswer || ''}
                        onChange={(e) => updateSituationAnswer(
                          situation.id, 
                          e.target.value, 
                          situationAnswers.find(sa => sa.situationId === situation.id)?.rating || 'MOYENNE'
                        )}
                        placeholder="Notez la réponse donnée par le candidat..."
                        style={{
                          width: '100%',
                          minHeight: '100px',
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(75, 85, 99, 0.3)',
                          borderRadius: '8px',
                          padding: '12px',
                          color: 'white',
                          fontSize: '14px',
                          resize: 'vertical',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ color: 'white', fontSize: '14px', fontWeight: '500', marginBottom: '12px', display: 'block' }}>
                        Évaluation de la réponse :
                      </label>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {['MAUVAISE', 'MOYENNE', 'BONNE'].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => updateSituationAnswer(
                              situation.id,
                              situationAnswers.find(sa => sa.situationId === situation.id)?.candidateAnswer || '',
                              rating as 'MAUVAISE' | 'MOYENNE' | 'BONNE'
                            )}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              border: '1px solid',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              background: situationAnswers.find(sa => sa.situationId === situation.id)?.rating === rating
                                ? rating === 'BONNE' ? 'rgba(34, 197, 94, 0.2)' 
                                : rating === 'MOYENNE' ? 'rgba(251, 146, 60, 0.2)'
                                : 'rgba(239, 68, 68, 0.2)'
                                : 'rgba(75, 85, 99, 0.1)',
                              borderColor: situationAnswers.find(sa => sa.situationId === situation.id)?.rating === rating
                                ? rating === 'BONNE' ? '#22c55e' 
                                : rating === 'MOYENNE' ? '#fb923c'
                                : '#ef4444'
                                : 'rgba(75, 85, 99, 0.3)',
                              color: situationAnswers.find(sa => sa.situationId === situation.id)?.rating === rating
                                ? rating === 'BONNE' ? '#22c55e' 
                                : rating === 'MOYENNE' ? '#fb923c'
                                : '#ef4444'
                                : '#9ca3af'
                            }}
                          >
                            {rating === 'BONNE' ? '✅ Bonne réponse' : 
                             rating === 'MOYENNE' ? '⚠️ Réponse moyenne' : 
                             '❌ Mauvaise réponse'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Étape 3: Finalisation */}
          {currentStep === 3 && (
            <div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: 'white',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}>
                  3
                </span>
                Finalisation de l'entretien
              </h3>
              <p style={{ color: '#9ca3af', marginBottom: '32px' }}>
                Finalisez l'entretien en ajoutant vos notes et en prenant votre décision finale.
              </p>

              <div style={{ display: 'grid', gap: '32px' }}>
                {/* Notes supplémentaires */}
                <div style={{
                  background: 'rgba(31, 41, 55, 0.6)',
                  border: '1px solid rgba(75, 85, 99, 0.3)',
                  borderRadius: '12px',
                  padding: '24px'
                }}>
                  <label style={{ color: 'white', fontSize: '16px', fontWeight: '500', marginBottom: '12px', display: 'block' }}>
                    Notes supplémentaires
                  </label>
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Ajoutez vos observations, recommandations ou commentaires supplémentaires..."
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(75, 85, 99, 0.3)',
                      borderRadius: '8px',
                      padding: '16px',
                      color: 'white',
                      fontSize: '14px',
                      resize: 'vertical',
                      outline: 'none',
                      lineHeight: '1.6'
                    }}
                  />
                </div>

                {/* Décision finale */}
                <div style={{
                  background: 'rgba(31, 41, 55, 0.6)',
                  border: '1px solid rgba(75, 85, 99, 0.3)',
                  borderRadius: '12px',
                  padding: '24px'
                }}>
                  <label style={{ color: 'white', fontSize: '16px', fontWeight: '500', marginBottom: '16px', display: 'block' }}>
                    Décision finale
                  </label>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {[
                      { value: 'FAVORABLE', label: 'Favorable', description: 'Le candidat est apte à poursuivre le processus' },
                      { value: 'A_SURVEILLER', label: 'À surveiller', description: 'Le candidat nécessite une attention particulière' },
                      { value: 'DEFAVORABLE', label: 'Défavorable', description: 'Le candidat n\'est pas apte à poursuivre' }
                    ].map((decision) => (
                      <button
                        key={decision.value}
                        onClick={() => setFinalDecision(decision.value as 'FAVORABLE' | 'DEFAVORABLE' | 'A_SURVEILLER')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          padding: '16px',
                          borderRadius: '12px',
                          border: '2px solid',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          textAlign: 'left',
                          background: finalDecision === decision.value
                            ? `${getDecisionColor(decision.value)}20`
                            : 'rgba(75, 85, 99, 0.1)',
                          borderColor: finalDecision === decision.value
                            ? getDecisionColor(decision.value)
                            : 'rgba(75, 85, 99, 0.3)',
                          transform: finalDecision === decision.value ? 'scale(1.02)' : 'scale(1)'
                        }}
                      >
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: '2px solid',
                          borderColor: finalDecision === decision.value 
                            ? getDecisionColor(decision.value)
                            : 'rgba(156, 163, 175, 0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: finalDecision === decision.value 
                            ? getDecisionColor(decision.value)
                            : 'transparent'
                        }}>
                          {finalDecision === decision.value && (
                            <div style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: 'white'
                            }}></div>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '4px'
                          }}>
                            {getDecisionIcon(decision.value)}
                            <span style={{
                              color: finalDecision === decision.value 
                                ? getDecisionColor(decision.value)
                                : 'white',
                              fontSize: '16px',
                              fontWeight: '600'
                            }}>
                              {decision.label}
                            </span>
                          </div>
                          <p style={{
                            color: '#9ca3af',
                            fontSize: '14px',
                            margin: 0
                          }}>
                            {decision.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '24px 32px',
          borderTop: '1px solid rgba(75, 85, 99, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: currentStep === 1 ? 'rgba(75, 85, 99, 0.3)' : 'rgba(75, 85, 99, 0.6)',
              color: currentStep === 1 ? '#6b7280' : 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <ChevronLeft style={{ width: '16px', height: '16px' }} />
            Précédent
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: step <= currentStep ? '#3b82f6' : 'rgba(75, 85, 99, 0.4)',
                  transition: 'all 0.2s ease'
                }}
              ></div>
            ))}
          </div>

          {currentStep < 3 ? (
            <button
              onClick={nextStep}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              Suivant
              <ChevronRight style={{ width: '16px', height: '16px' }} />
            </button>
          ) : (
            <button
              onClick={completeInterview}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: loading 
                  ? 'rgba(34, 197, 94, 0.5)' 
                  : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <CheckCircle style={{ width: '16px', height: '16px' }} />
              {loading ? 'Finalisation...' : 'Finaliser l\'entretien'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
