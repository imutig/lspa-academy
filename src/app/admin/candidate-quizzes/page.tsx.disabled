'use client'

// Force dynamic rendering pour éviter les erreurs de build avec useSearchParams
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface QuizAttempt {
  id: string
  score: number
  completedAt: string
  answers: any
  quiz: {
    id: string
    title: string
    description?: string
  }
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export default function CandidateQuizzesPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const candidateId = searchParams.get('candidateId')
  const sessionId = searchParams.get('sessionId')

  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([])
  const [selectedAttempt, setSelectedAttempt] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (candidateId && sessionId) {
      fetchQuizAttempts()
    }
  }, [candidateId, sessionId])

  const fetchQuizAttempts = async () => {
    try {
      const response = await fetch(`/api/admin/candidate-quizzes?candidateId=${candidateId}&sessionId=${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setQuizAttempts(data.attempts)
      } else {
        setError('Impossible de charger les quiz du candidat')
      }
    } catch (err) {
      setError('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const fetchAttemptDetails = async (attemptId: string) => {
    try {
      const response = await fetch(`/api/quiz/attempt-details?attemptId=${attemptId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedAttempt(data.attempt)
      } else {
        alert('Impossible de récupérer les détails du quiz')
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error)
      alert('Erreur lors de la récupération des détails')
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #111827 50%, #1f2937 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid transparent',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p>Chargement des quiz...</p>
        </div>
      </div>
    )
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
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #ffffff 0%, #60a5fa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            📝 Quiz du Candidat
          </h1>
          {quizAttempts.length > 0 && (
            <p style={{
              color: '#9ca3af',
              fontSize: '16px',
              margin: '0'
            }}>
              {quizAttempts[0].user.firstName} {quizAttempts[0].user.lastName} - {quizAttempts[0].user.email}
            </p>
          )}
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            color: '#fca5a5',
            textAlign: 'center'
          }}>
            ⚠️ {error}
          </div>
        )}

        {selectedAttempt ? (
          /* Détails d'une tentative */
          <div style={{
            background: 'rgba(17, 24, 39, 0.7)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(75, 85, 99, 0.3)',
            borderRadius: '16px',
            padding: '32px'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '24px' 
            }}>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: 'white', 
                margin: 0 
              }}>
                Détails - {selectedAttempt.quiz?.title}
              </h2>
              <button
                onClick={() => setSelectedAttempt(null)}
                style={{
                  background: 'none',
                  border: '1px solid #3b82f6',
                  color: '#3b82f6',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                ← Retour à la liste
              </button>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px', 
              marginBottom: '24px' 
            }}>
              <div style={{ 
                backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                padding: '12px', 
                borderRadius: '8px' 
              }}>
                <strong style={{ color: 'white' }}>Score: {selectedAttempt.score}%</strong>
              </div>
              <div style={{ 
                backgroundColor: 'rgba(34, 197, 94, 0.1)', 
                padding: '12px', 
                borderRadius: '8px' 
              }}>
                <strong style={{ color: 'white' }}>
                  Questions correctes: {selectedAttempt.summary?.correctAnswers}/{selectedAttempt.summary?.totalQuestions}
                </strong>
              </div>
              <div style={{ 
                backgroundColor: 'rgba(168, 85, 247, 0.1)', 
                padding: '12px', 
                borderRadius: '8px' 
              }}>
                <strong style={{ color: 'white' }}>
                  Points: {selectedAttempt.summary?.earnedPoints}/{selectedAttempt.summary?.totalPoints}
                </strong>
              </div>
            </div>

            <div>
              <h4 style={{ color: '#10b981', marginBottom: '16px' }}>Réponses détaillées</h4>
              {selectedAttempt.answers?.map((answer: any, index: number) => (
                <div key={index} style={{ 
                  backgroundColor: answer.isCorrect ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${answer.isCorrect ? '#10b981' : '#ef4444'}`,
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <p style={{ color: 'white' }}>
                    <strong>Question {index + 1}:</strong> {answer.question}
                  </p>
                  <div style={{ marginLeft: '16px' }}>
                    <p style={{ color: 'white' }}>
                      <strong>Réponse du candidat:</strong> 
                      <span style={{ 
                        color: answer.isCorrect ? '#10b981' : '#ef4444', 
                        marginLeft: '8px' 
                      }}>
                        {answer.userAnswer.text}
                      </span>
                    </p>
                    <p style={{ color: 'white' }}>
                      <strong>Bonne réponse:</strong> 
                      <span style={{ color: '#10b981', marginLeft: '8px' }}>
                        {answer.correctAnswer.text}
                      </span>
                    </p>
                    <p style={{ color: 'white' }}>
                      <strong>Points:</strong> {answer.pointsEarned}/{answer.points}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Liste des tentatives */
          <div>
            {quizAttempts.length > 0 ? (
              <div style={{
                display: 'grid',
                gap: '16px'
              }}>
                {quizAttempts.map((attempt, index) => (
                  <div 
                    key={attempt.id}
                    onClick={() => fetchAttemptDetails(attempt.id)}
                    style={{ 
                      background: 'rgba(17, 24, 39, 0.7)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(75, 85, 99, 0.3)',
                      borderRadius: '12px',
                      padding: '24px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(75, 85, 99, 0.3)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center' 
                    }}>
                      <div>
                        <h3 style={{ 
                          margin: '0 0 8px 0', 
                          fontWeight: 'bold',
                          color: 'white',
                          fontSize: '18px'
                        }}>
                          📝 {attempt.quiz.title}
                        </h3>
                        <p style={{ 
                          margin: '0', 
                          color: '#9ca3af', 
                          fontSize: '14px' 
                        }}>
                          {new Date(attempt.completedAt).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ 
                          margin: '0', 
                          fontWeight: 'bold',
                          color: attempt.score >= 80 ? '#10b981' : '#ef4444',
                          fontSize: '24px'
                        }}>
                          {attempt.score}%
                        </p>
                        <p style={{ 
                          margin: '0', 
                          color: '#9ca3af', 
                          fontSize: '12px' 
                        }}>
                          {attempt.score >= 80 ? '✅ Réussi' : '❌ Échoué'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                background: 'rgba(17, 24, 39, 0.7)',
                backdropFilter: 'blur(16px)',
                border: '2px dashed rgba(75, 85, 99, 0.3)',
                borderRadius: '16px',
                padding: '48px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '64px',
                  marginBottom: '24px',
                  opacity: 0.7
                }}>
                  📝
                </div>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '12px'
                }}>
                  Aucun quiz réalisé
                </h3>
                <p style={{
                  color: '#9ca3af',
                  fontSize: '16px',
                  margin: '0'
                }}>
                  Ce candidat n'a pas encore passé de quiz
                </p>
              </div>
            )}
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
