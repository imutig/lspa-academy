'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface InterviewReport {
  id: string
  status: string
  decision: string
  notes: string
  conductedBy: string
  interviewer: {
    name: string
    email: string
  } | null
  completedAt: string
  session: {
    id: string
    name: string
  }
  questions: Array<{
    id: string
    question: string
    candidateAnswer: string
    rating: number
    category: string
  }>
  situations: Array<{
    id: string
    situation: string
    description: string
    candidateAnswer: string
    evaluation: string
    category: string
  }>
}

export default function InterviewReportPage() {
  const [report, setReport] = useState<InterviewReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchReport()
  }, [])

  const fetchReport = async () => {
    try {
      const response = await fetch('/api/candidate/interview-report')
      if (response.ok) {
        const data = await response.json()
        setReport(data.interview)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erreur lors du chargement du compte-rendu')
      }
    } catch (error) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'FAVORABLE':
        return '#22c55e'
      case 'DEFAVORABLE':
        return '#ef4444'
      case 'A_SURVEILLER':
        return '#f59e0b'
      default:
        return '#6b7280'
    }
  }

  const getDecisionLabel = (decision: string) => {
    switch (decision) {
      case 'FAVORABLE':
        return '✅ Favorable'
      case 'DEFAVORABLE':
        return '❌ Défavorable'
      case 'A_SURVEILLER':
        return '⚠️ À surveiller'
      default:
        return '⏳ En attente'
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return '#22c55e'
    if (rating >= 3) return '#f59e0b'
    if (rating >= 2) return '#f97316'
    return '#ef4444'
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #111827 50%, #1f2937 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'rgba(17, 24, 39, 0.8)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '40px',
          border: '1px solid rgba(75, 85, 99, 0.3)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(59, 130, 246, 0.3)',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: 'white', margin: 0 }}>Chargement du compte-rendu...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #111827 50%, #1f2937 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'rgba(17, 24, 39, 0.8)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '40px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <h2 style={{ color: 'white', marginBottom: '16px' }}>Erreur</h2>
          <p style={{ color: '#9ca3af', marginBottom: '24px' }}>{error}</p>
          <button
            onClick={() => router.push('/candidate/dashboard')}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    )
  }

  if (!report) {
    return null
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000000 0%, #111827 50%, #1f2937 100%)',
      padding: '32px 16px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          background: 'rgba(17, 24, 39, 0.8)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '32px',
          border: '1px solid rgba(75, 85, 99, 0.3)',
          marginBottom: '32px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px'
          }}>
            <h1 style={{
              color: 'white',
              fontSize: '32px',
              fontWeight: 'bold',
              margin: 0
            }}>📋 Compte-rendu d'entretien</h1>
            <button
              onClick={() => router.push('/candidate/dashboard')}
              style={{
                background: 'rgba(75, 85, 99, 0.3)',
                color: 'white',
                border: '1px solid rgba(75, 85, 99, 0.5)',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              ← Retour
            </button>
          </div>

          {/* Info générale */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
            marginBottom: '24px'
          }}>
            <div>
              <h3 style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 8px 0' }}>Session</h3>
              <p style={{ color: 'white', fontSize: '16px', margin: 0, fontWeight: '600' }}>{report.session.name}</p>
            </div>
            <div>
              <h3 style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 8px 0' }}>Date</h3>
              <p style={{ color: 'white', fontSize: '16px', margin: 0, fontWeight: '600' }}>
                {new Date(report.completedAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            {report.interviewer && (
              <div>
                <h3 style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 8px 0' }}>Instructeur</h3>
                <p style={{ color: 'white', fontSize: '16px', margin: 0, fontWeight: '600' }}>{report.interviewer.name}</p>
                <p style={{ color: '#9ca3af', fontSize: '12px', margin: '4px 0 0 0' }}>{report.interviewer.email}</p>
              </div>
            )}
            {report.conductedBy && !report.interviewer && (
              <div>
                <h3 style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 8px 0' }}>Conduit par</h3>
                <p style={{ color: 'white', fontSize: '16px', margin: 0, fontWeight: '600' }}>{report.conductedBy}</p>
              </div>
            )}
          </div>

          {/* Décision */}
          <div style={{
            background: `rgba(${getDecisionColor(report.decision).slice(1).match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.1)`,
            border: `1px solid ${getDecisionColor(report.decision)}40`,
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              background: getDecisionColor(report.decision),
              color: 'white',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {getDecisionLabel(report.decision)}
            </div>
            <p style={{ color: 'white', margin: 0, fontSize: '16px' }}>
              Décision finale de l'entretien
            </p>
          </div>
        </div>

        {/* Questions */}
        {report.questions.length > 0 && (
          <div style={{
            background: 'rgba(17, 24, 39, 0.8)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '32px',
            border: '1px solid rgba(75, 85, 99, 0.3)',
            marginBottom: '32px'
          }}>
            <h2 style={{
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '24px'
            }}>❓ Questions d'entretien</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {report.questions.map((q, index) => (
                <div key={q.id} style={{
                  background: 'rgba(31, 41, 55, 0.5)',
                  borderRadius: '12px',
                  padding: '24px',
                  border: '1px solid rgba(75, 85, 99, 0.3)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}>
                    <h3 style={{
                      color: 'white',
                      fontSize: '18px',
                      fontWeight: '600',
                      margin: 0
                    }}>Question {index + 1}</h3>
                    <div style={{
                      background: getRatingColor(q.rating),
                      color: 'white',
                      borderRadius: '20px',
                      padding: '4px 12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {q.rating}/5
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 8px 0' }}>Question:</h4>
                    <p style={{ color: 'white', fontSize: '16px', margin: 0, lineHeight: '1.6' }}>{q.question}</p>
                  </div>
                  
                  <div>
                    <h4 style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 8px 0' }}>Votre réponse:</h4>
                    <p style={{ 
                      color: 'white', 
                      fontSize: '16px', 
                      margin: 0, 
                      lineHeight: '1.6',
                      background: 'rgba(17, 24, 39, 0.5)',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(75, 85, 99, 0.3)'
                    }}>
                      {q.candidateAnswer || 'Aucune réponse enregistrée'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Situations */}
        {report.situations.length > 0 && (
          <div style={{
            background: 'rgba(17, 24, 39, 0.8)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '32px',
            border: '1px solid rgba(75, 85, 99, 0.3)',
            marginBottom: '32px'
          }}>
            <h2 style={{
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '24px'
            }}>🎭 Mises en situation</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {report.situations.map((s, index) => (
                <div key={s.id} style={{
                  background: 'rgba(31, 41, 55, 0.5)',
                  borderRadius: '12px',
                  padding: '24px',
                  border: '1px solid rgba(75, 85, 99, 0.3)'
                }}>
                  <h3 style={{
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '16px'
                  }}>Situation {index + 1}: {s.situation}</h3>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 8px 0' }}>Description:</h4>
                    <p style={{ color: 'white', fontSize: '16px', margin: 0, lineHeight: '1.6' }}>{s.description}</p>
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 8px 0' }}>Votre réponse:</h4>
                    <p style={{ 
                      color: 'white', 
                      fontSize: '16px', 
                      margin: 0, 
                      lineHeight: '1.6',
                      background: 'rgba(17, 24, 39, 0.5)',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(75, 85, 99, 0.3)'
                    }}>
                      {s.candidateAnswer || 'Aucune réponse enregistrée'}
                    </p>
                  </div>
                  
                  {s.evaluation && (
                    <div>
                      <h4 style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 8px 0' }}>Évaluation:</h4>
                      <p style={{ 
                        color: 'white', 
                        fontSize: '16px', 
                        margin: 0, 
                        lineHeight: '1.6',
                        background: 'rgba(59, 130, 246, 0.1)',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid rgba(59, 130, 246, 0.3)'
                      }}>
                        {s.evaluation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes générales */}
        {report.notes && (
          <div style={{
            background: 'rgba(17, 24, 39, 0.8)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '32px',
            border: '1px solid rgba(75, 85, 99, 0.3)',
            marginBottom: '32px'
          }}>
            <h2 style={{
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '24px'
            }}>📝 Notes générales</h2>
            
            <p style={{ 
              color: 'white', 
              fontSize: '16px', 
              margin: 0, 
              lineHeight: '1.6',
              background: 'rgba(31, 41, 55, 0.5)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid rgba(75, 85, 99, 0.3)'
            }}>
              {report.notes}
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
