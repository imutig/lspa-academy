import React, { useState, useEffect } from 'react'
import { X, FileText, User, Calendar, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

interface InterviewData {
  id: string
  status: string
  finalDecision: string
  additionalNotes: string
  conductedBy: string
  createdAt: string
  updatedAt: string
  questions: Array<{
    questionId: string
    answer: string
    question?: {
      id: string
      title: string
      description: string
    }
  }>
  situations: Array<{
    situationId: string
    candidateAnswer: string
    rating: 'MAUVAISE' | 'MOYENNE' | 'BONNE'
    situation?: {
      id: string
      title: string
      description: string
    }
  }>
}

interface CandidateInfo {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface InterviewReportModalProps {
  isOpen: boolean
  onClose: () => void
  candidateId: string
  sessionId: string
}

export default function InterviewReportModal({ 
  isOpen, 
  onClose, 
  candidateId, 
  sessionId 
}: InterviewReportModalProps) {
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null)
  const [candidateInfo, setCandidateInfo] = useState<CandidateInfo | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && candidateId && sessionId) {
      fetchInterviewReport()
    }
  }, [isOpen, candidateId, sessionId])

  const fetchInterviewReport = async () => {
    try {
      setLoading(true)
      
      // Récupérer les données de l'entretien (qui incluent maintenant les infos du candidat)
      const interviewResponse = await fetch(`/api/sessions/${sessionId}/candidates/${candidateId}/interview`)
      if (interviewResponse.ok) {
        const interview = await interviewResponse.json()
        console.log('Données interview reçues:', interview)
        setInterviewData(interview)
        // Les informations du candidat sont maintenant incluses dans l'entretien
        if (interview.candidate) {
          setCandidateInfo(interview.candidate)
        }
      } else {
        console.error('Erreur HTTP:', interviewResponse.status, await interviewResponse.text())
      }
    } catch (error) {
      console.error('Erreur lors du chargement du rapport:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'FAVORABLE': return <CheckCircle style={{ color: '#22c55e' }} />
      case 'DEFAVORABLE': return <XCircle style={{ color: '#ef4444' }} />
      case 'A_SURVEILLER': return <AlertTriangle style={{ color: '#f59e0b' }} />
      default: return null
    }
  }

  const getDecisionLabel = (decision: string) => {
    switch (decision) {
      case 'FAVORABLE': return 'Favorable'
      case 'DEFAVORABLE': return 'Défavorable'
      case 'A_SURVEILLER': return 'À surveiller'
      default: return decision
    }
  }

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'BONNE': return '✅'
      case 'MOYENNE': return '⚠️'
      case 'MAUVAISE': return '❌'
      case null:
      case undefined:
      case '':
        return '⏳'  // Sablier pour "en attente d'évaluation"
      default: return '❓'
    }
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'BONNE': return '#22c55e'
      case 'MOYENNE': return '#f59e0b'
      case 'MAUVAISE': return '#ef4444'
      case null:
      case undefined:
      case '':
        return '#9ca3af'  // Gris pour "en attente"
      default: return '#6b7280'
    }
  }

  const getRatingLabel = (rating: string) => {
    switch (rating) {
      case 'BONNE': return 'BONNE'
      case 'MOYENNE': return 'MOYENNE'
      case 'MAUVAISE': return 'MAUVAISE'
      case null:
      case undefined:
      case '':
        return 'EN ATTENTE'
      default: return rating || 'NON ÉVALUÉE'
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
      background: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'hidden',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          background: 'rgba(30, 41, 59, 0.5)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText style={{ color: '#3b82f6', width: '24px', height: '24px' }} />
            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '600', margin: 0 }}>
              Compte-rendu d'entretien
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(148, 163, 184, 0.1)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(148, 163, 184, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)'
            }}
          >
            <X style={{ color: 'white', width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          maxHeight: 'calc(90vh - 100px)'
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              color: '#9ca3af'
            }}>
              Chargement du rapport...
            </div>
          ) : (
            <>
              {/* Informations générales */}
              <div style={{
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(75, 85, 99, 0.3)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <h3 style={{
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: '0 0 16px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <User style={{ width: '20px', height: '20px' }} />
                  Informations générales
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 4px 0' }}>Candidat</p>
                    <p style={{ color: 'white', fontSize: '16px', margin: 0, fontWeight: '500' }}>
                      {candidateInfo ? `${candidateInfo.firstName} ${candidateInfo.lastName}` : 'Candidat'}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 4px 0' }}>Conduit par</p>
                    <p style={{ color: 'white', fontSize: '16px', margin: 0 }}>
                      {interviewData?.conductedBy || 'Non spécifié'}
                    </p>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 4px 0' }}>Date</p>
                    <p style={{ color: 'white', fontSize: '16px', margin: 0 }}>
                      {interviewData?.createdAt 
                        ? new Date(interviewData.createdAt).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Non spécifié'}
                    </p>
                  </div>
                </div>

                {/* Décision finale */}
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(75, 85, 99, 0.3)' }}>
                  <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 8px 0' }}>Décision finale</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getDecisionIcon(interviewData?.finalDecision || '')}
                    <span style={{
                      color: 'white',
                      fontSize: '18px',
                      fontWeight: '600'
                    }}>
                      {getDecisionLabel(interviewData?.finalDecision || '')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Questions */}
              {interviewData?.questions && interviewData.questions.length > 0 && (
                <div style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(75, 85, 99, 0.3)',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '24px'
                }}>
                  <h3 style={{
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: '0 0 20px 0'
                  }}>
                    Questions posées ({interviewData.questions.length})
                  </h3>
                  
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {interviewData.questions.map((qa, index) => (
                      <div key={qa.questionId} style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(75, 85, 99, 0.2)',
                        borderRadius: '8px',
                        padding: '16px'
                      }}>
                        <div style={{ marginBottom: '12px' }}>
                          <span style={{
                            background: 'rgba(59, 130, 246, 0.2)',
                            color: '#93c5fd',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            Q{index + 1}
                          </span>
                        </div>
                        <h4 style={{ color: 'white', fontSize: '16px', fontWeight: '500', margin: '0 0 8px 0' }}>
                          {qa.question?.title || 'Question'}
                        </h4>
                        {qa.question?.description && (
                          <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 12px 0' }}>
                            {qa.question.description}
                          </p>
                        )}
                        <div style={{
                          background: 'rgba(34, 197, 94, 0.05)',
                          border: '1px solid rgba(34, 197, 94, 0.2)',
                          borderRadius: '6px',
                          padding: '12px'
                        }}>
                          <p style={{ color: '#86efac', fontSize: '12px', fontWeight: '500', margin: '0 0 6px 0' }}>
                            Réponse du candidat :
                          </p>
                          <p style={{ color: 'white', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
                            {qa.answer || 'Aucune réponse enregistrée'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Situations */}
              {interviewData?.situations && interviewData.situations.length > 0 && (
                <div style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(75, 85, 99, 0.3)',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '24px'
                }}>
                  <h3 style={{
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: '0 0 20px 0'
                  }}>
                    Mises en situation ({interviewData.situations.length})
                  </h3>
                  
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {interviewData.situations.map((sa, index) => (
                      <div key={sa.situationId} style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(75, 85, 99, 0.2)',
                        borderRadius: '8px',
                        padding: '16px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <span style={{
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: '#86efac',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            S{index + 1}
                          </span>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: `rgba(${getRatingColor(sa.rating).substring(1, 3)}, ${getRatingColor(sa.rating).substring(3, 5)}, ${getRatingColor(sa.rating).substring(5, 7)}, 0.1)`,
                            border: `1px solid ${getRatingColor(sa.rating)}40`,
                            borderRadius: '6px',
                            padding: '4px 8px'
                          }}>
                            <span style={{ fontSize: '12px' }}>{getRatingIcon(sa.rating)}</span>
                            <span style={{ color: getRatingColor(sa.rating), fontSize: '12px', fontWeight: '500' }}>
                              {getRatingLabel(sa.rating)}
                            </span>
                          </div>
                        </div>
                        <h4 style={{ color: 'white', fontSize: '16px', fontWeight: '500', margin: '0 0 8px 0' }}>
                          {sa.situation?.title || 'Situation'}
                        </h4>
                        {sa.situation?.description && (
                          <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 12px 0' }}>
                            {sa.situation.description}
                          </p>
                        )}
                        <div style={{
                          background: 'rgba(34, 197, 94, 0.05)',
                          border: '1px solid rgba(34, 197, 94, 0.2)',
                          borderRadius: '6px',
                          padding: '12px'
                        }}>
                          <p style={{ color: '#86efac', fontSize: '12px', fontWeight: '500', margin: '0 0 6px 0' }}>
                            Réponse du candidat :
                          </p>
                          <p style={{ color: 'white', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
                            {sa.candidateAnswer || 'Aucune réponse enregistrée'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes supplémentaires */}
              {interviewData?.additionalNotes && (
                <div style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(75, 85, 99, 0.3)',
                  borderRadius: '12px',
                  padding: '24px'
                }}>
                  <h3 style={{
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: '0 0 16px 0'
                  }}>
                    Notes supplémentaires
                  </h3>
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(75, 85, 99, 0.2)',
                    borderRadius: '8px',
                    padding: '16px'
                  }}>
                    <p style={{ color: 'white', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
                      {interviewData.additionalNotes}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
