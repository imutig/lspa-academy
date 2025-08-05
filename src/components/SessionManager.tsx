'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { modernDesign } from '../utils/modernDesign'

interface Quiz {
  id: string
  title: string
  _count: {
    questions: number
  }
  timeLimit: number
  passingScoreNormal: number
  passingScoreToWatch: number
}

interface SessionQuiz {
  id: string
  isActive: boolean
  quiz: Quiz
}

interface Session {
  id: string
  name: string
  date: string
  location: string
  maxCandidates: number
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED'
  _count: {
    candidates: number
  }
}

interface Candidate {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  registeredAt: string
  interview?: {
    id: string
    conductedBy?: string
    completedAt?: string
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'
  }
}

interface SessionManagerProps {
  userRole: string
}

export default function SessionManager({ userRole }: SessionManagerProps) {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showQuizAssignment, setShowQuizAssignment] = useState(false)
  const [showSessionDetails, setShowSessionDetails] = useState(false)
  const [selectedSession, setSelectedSession] = useState('')
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([])
  const [sessionQuizzes, setSessionQuizzes] = useState<SessionQuiz[]>([])
  const [sessionCandidates, setSessionCandidates] = useState<Candidate[]>([])
  const [selectedQuizForAssignment, setSelectedQuizForAssignment] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    maxCandidates: 20
  })

  useEffect(() => {
    fetchSessions()
    setTimeout(() => setIsLoaded(true), 100)
  }, [])

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions')
      if (!response.ok) throw new Error('Erreur lors du chargement')
      const data = await response.json()
      setSessions(data)
    } catch (err) {
      setError('Impossible de charger les sessions')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableQuizzes = async () => {
    try {
      const response = await fetch('/api/quizzes')
      if (!response.ok) throw new Error('Erreur lors du chargement des quiz')
      const data = await response.json()
      setAvailableQuizzes(data)
    } catch (err) {
      setError('Impossible de charger les quiz')
    }
  }

  const fetchSessionQuizzes = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/quizzes`)
      if (!response.ok) throw new Error('Erreur lors du chargement')
      const data = await response.json()
      setSessionQuizzes(data)
    } catch (err) {
      setError('Impossible de charger les quiz de la session')
    }
  }

  const fetchSessionCandidates = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/candidates`)
      if (!response.ok) throw new Error('Erreur lors du chargement')
      const data = await response.json()
      setSessionCandidates(data)
    } catch (err) {
      setError('Impossible de charger les candidats de la session')
    }
  }

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) throw new Error('Erreur lors de la création')
      
      setShowForm(false)
      setFormData({ name: '', date: '', location: '', maxCandidates: 20 })
      fetchSessions()
    } catch (err) {
      setError('Impossible de créer la session')
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) return
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Erreur lors de la suppression')
      fetchSessions()
    } catch (err) {
      setError('Impossible de supprimer la session')
    }
  }

  const handleAssignQuiz = async () => {
    if (!selectedQuizForAssignment || !selectedSession) return
    
    try {
      const response = await fetch(`/api/sessions/${selectedSession}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: selectedQuizForAssignment })
      })
      
      if (!response.ok) throw new Error('Erreur lors de l\'assignation')
      
      setSelectedQuizForAssignment('')
      fetchSessionQuizzes(selectedSession)
      fetchAvailableQuizzes()
    } catch (err) {
      setError('Impossible d\'assigner le quiz')
    }
  }

  const handleUnassignQuiz = async (sessionQuizId: string) => {
    try {
      const response = await fetch(`/api/session-quizzes/${sessionQuizId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Erreur lors de la suppression')
      fetchSessionQuizzes(selectedSession)
    } catch (err) {
      setError('Impossible de retirer le quiz')
    }
  }

  const handleToggleQuizActivation = async (sessionQuizId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/session-quizzes/${sessionQuizId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isActive: !currentStatus
        })
      })
      
      if (!response.ok) throw new Error('Erreur lors de la mise à jour')
      fetchSessionQuizzes(selectedSession)
    } catch (err) {
      setError('Impossible de changer le statut du quiz')
    }
  }

  const canManageSessions = ['SUPERVISEUR', 'DIRECTEUR'].includes(userRole)

  const handleManageQuizzes = (sessionId: string) => {
    setSelectedSession(sessionId)
    setShowQuizAssignment(true)
    fetchAvailableQuizzes()
    fetchSessionQuizzes(sessionId)
  }

  const handleViewSessionDetails = (sessionId: string) => {
    // Navigation vers la nouvelle page de détails de session
    router.push(`/admin/sessions/${sessionId}`)
  }

  const handleConductInterview = (candidateId: string, sessionId: string) => {
    // Redirection vers la page d'entretien avec les paramètres
    window.open(`/admin/interview?candidateId=${candidateId}&sessionId=${sessionId}&mode=conduct`, '_blank')
  }

  const handleViewInterviewReport = (candidateId: string, sessionId: string) => {
    // Redirection vers la page d'entretien en mode consultation
    window.open(`/admin/interview?candidateId=${candidateId}&sessionId=${sessionId}&mode=view`, '_blank')
  }

  const handleViewCandidateQuizzes = (candidateId: string, sessionId: string) => {
    // Redirection vers une nouvelle page pour voir les quiz du candidat
    window.open(`/admin/candidate-quizzes?candidateId=${candidateId}&sessionId=${sessionId}`, '_blank')
  }

  // Global styles for the entire component
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
      
      @keyframes modernFloat {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-6px); }
      }
      
      @keyframes modernShimmer {
        0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
        100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
      }
      
      @keyframes modernGlow {
        0% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
        100% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.6); }
      }
      
      @keyframes modernRotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes modernGradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `}</style>
  )

  if (loading) {
    return (
      <>
        {styles}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px',
          ...modernDesign.glass.card
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid transparent',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'modernRotate 1s linear infinite'
            }}></div>
            <p style={{...modernDesign.typography.body, color: '#d1d5db'}}>
              Chargement des sessions...
            </p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {styles}
      <div style={{
        opacity: isLoaded ? 1 : 0,
        transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease-out'
      }}>
        {/* Modern Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          padding: '24px 0',
          position: 'relative'
        }}>
          <div>
            <h2 style={{
              ...modernDesign.typography.title,
              fontSize: '32px',
              margin: '0 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{
                fontSize: '36px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>🎯</span>
              Gestion des Sessions
            </h2>
            <p style={{
              ...modernDesign.typography.body,
              fontSize: '16px',
              margin: '0'
            }}>
              Créez et gérez les sessions de recrutement
            </p>
          </div>
          
          {canManageSessions && (
            <button
              onClick={() => setShowForm(true)}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, {
                  transform: 'translateY(-2px) scale(1.05)',
                  boxShadow: '0 12px 30px rgba(59, 130, 246, 0.4)'
                })
              }}
              onMouseLeave={(e) => {
                Object.assign(e.currentTarget.style, {
                  transform: 'none',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                })
              }}
              style={{
                ...modernDesign.buttons.primary,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '16px',
                padding: '16px 24px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <span style={{fontSize: '20px'}}>➕</span>
              <span>Nouvelle Session</span>
            </button>
          )}
        </div>

        {/* Enhanced Error Display */}
        {error && (
          <div style={{
            ...modernDesign.glass.card,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '20px',
            marginBottom: '24px',
            borderRadius: '12px',
            animation: 'modernSlideIn 0.3s ease-out'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{fontSize: '24px'}}>⚠️</span>
              <p style={{
                color: '#fca5a5',
                margin: '0',
                fontSize: '16px',
                fontWeight: '500'
              }}>
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Modern Create Form */}
        {showForm && (
          <div style={{
            ...modernDesign.glass.card,
            padding: '32px',
            marginBottom: '32px',
            position: 'relative',
            overflow: 'hidden',
            animation: 'modernScale 0.4s ease-out'
          }}>
            {/* Form background gradient */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
              opacity: 0.5
            }} />
            
            <div style={{position: 'relative', zIndex: 1}}>
              <h3 style={{
                ...modernDesign.typography.subtitle,
                fontSize: '24px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{fontSize: '28px'}}>✨</span>
                Créer une nouvelle session
              </h3>
              
              <form onSubmit={handleCreateSession}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '24px',
                  marginBottom: '32px'
                }}>
                  {/* Name Field */}
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: '#d1d5db',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      Nom de la session
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      style={{
                        ...modernDesign.inputs.modern,
                        width: '100%'
                      }}
                      placeholder="Ex: Session de recrutement Janvier 2024"
                    />
                  </div>

                  {/* Date Field */}
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: '#d1d5db',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      Date et heure
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      style={{
                        ...modernDesign.inputs.modern,
                        width: '100%'
                      }}
                    />
                  </div>

                  {/* Location Field */}
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: '#d1d5db',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      Lieu
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                      style={{
                        ...modernDesign.inputs.modern,
                        width: '100%'
                      }}
                      placeholder="Ex: Salle de formation - Bâtiment A"
                    />
                  </div>

                  {/* Max Candidates Field */}
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: '#d1d5db',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      Nombre maximum de candidats
                    </label>
                    <input
                      type="number"
                      value={formData.maxCandidates}
                      onChange={(e) => setFormData({ ...formData, maxCandidates: parseInt(e.target.value) })}
                      min="1"
                      max="100"
                      required
                      style={{
                        ...modernDesign.inputs.modern,
                        width: '100%'
                      }}
                    />
                  </div>
                </div>
                
                {/* Form Actions */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    onMouseEnter={(e) => {
                      Object.assign(e.currentTarget.style, {
                        background: 'rgba(59, 130, 246, 0.1)',
                        transform: 'translateY(-1px)'
                      })
                    }}
                    onMouseLeave={(e) => {
                      Object.assign(e.currentTarget.style, {
                        background: 'transparent',
                        transform: 'none'
                      })
                    }}
                    style={{
                      ...modernDesign.buttons.secondary,
                      padding: '14px 28px'
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    style={{
                      ...modernDesign.buttons.primary,
                      padding: '14px 28px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
                    }}
                  >
                    ✨ Créer la session
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modern Sessions Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {sessions.map((session, index) => (
            <div
              key={session.id}
              style={{
                ...modernDesign.glass.card,
                position: 'relative',
                overflow: 'hidden',
                padding: '24px',
                cursor: 'pointer',
                animation: `modernSlideIn 0.5s ease-out ${index * 0.1}s both`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(59, 130, 246, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(59, 130, 246, 0.1)';
              }}
            >
              {/* Status Badge */}
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                ...modernDesign.badges.info,
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {session.status === 'PLANNED' ? 'Planifiée' :
                 session.status === 'ACTIVE' ? 'En cours' : 'Terminée'}
              </div>

              {/* Session Header */}
              <div style={{
                marginBottom: '20px'
              }}>
                <h3 style={{
                  ...modernDesign.typography.subtitle,
                  fontSize: '20px',
                  margin: '0 0 8px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{fontSize: '24px'}}>🎯</span>
                  {session.name}
                </h3>
                <p style={{
                  color: '#9ca3af',
                  margin: '0',
                  fontSize: '14px'
                }}>
                  Session #{session.id}
                </p>
              </div>

              {/* Session Details */}
              <div style={{
                display: 'grid',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                  <span style={{fontSize: '20px'}}>📅</span>
                  <div>
                    <p style={{
                      margin: '0',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#e5e7eb'
                    }}>
                      {new Date(session.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p style={{
                      margin: '0',
                      fontSize: '12px',
                      color: '#9ca3af'
                    }}>
                      {new Date(session.date).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: 'rgba(139, 92, 246, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                  <span style={{fontSize: '20px'}}>📍</span>
                  <div>
                    <p style={{
                      margin: '0',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#e5e7eb'
                    }}>
                      {session.location}
                    </p>
                    <p style={{
                      margin: '0',
                      fontSize: '12px',
                      color: '#9ca3af'
                    }}>
                      Lieu de la session
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  <span style={{fontSize: '20px'}}>👥</span>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%'
                  }}>
                    <div>
                      <p style={{
                        margin: '0',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#e5e7eb'
                      }}>
                        {session._count.candidates} / {session.maxCandidates}
                      </p>
                      <p style={{
                        margin: '0',
                        fontSize: '12px',
                        color: '#9ca3af'
                      }}>
                        Candidats inscrits
                      </p>
                    </div>
                    <div style={{
                      width: '60px',
                      height: '6px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(session._count.candidates / session.maxCandidates) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #10b981, #059669)',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {canManageSessions && (
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => handleViewSessionDetails(session.id)}
                    style={{
                      ...modernDesign.buttons.secondary,
                      flex: '1',
                      minWidth: '120px',
                      fontSize: '14px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <span style={{fontSize: '16px'}}>👥</span>
                    <span>Détails</span>
                  </button>
                  
                  <button
                    onClick={() => handleManageQuizzes(session.id)}
                    style={{
                      ...modernDesign.buttons.secondary,
                      flex: '1',
                      minWidth: '120px',
                      fontSize: '14px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <span style={{fontSize: '16px'}}>📝</span>
                    <span>Quiz</span>
                  </button>
                  
                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    style={{
                      ...modernDesign.buttons.secondary,
                      flex: '1',
                      minWidth: '120px',
                      fontSize: '14px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      justifyContent: 'center',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#fca5a5',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <span style={{fontSize: '16px'}}>🗑️</span>
                    <span>Supprimer</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {sessions.length === 0 && (
          <div style={{
            ...modernDesign.glass.card,
            padding: '48px',
            textAlign: 'center',
            background: 'rgba(59, 130, 246, 0.05)',
            border: '2px dashed rgba(59, 130, 246, 0.3)'
          }}>
            <div style={{
              fontSize: '64px',
              marginBottom: '24px',
              opacity: 0.7
            }}>
              🎯
            </div>
            <h3 style={{
              ...modernDesign.typography.subtitle,
              fontSize: '24px',
              marginBottom: '12px'
            }}>
              Aucune session créée
            </h3>
            <p style={{
              ...modernDesign.typography.body,
              fontSize: '16px',
              marginBottom: '24px',
              opacity: 0.8
            }}>
              Commencez par créer votre première session de recrutement
            </p>
            {canManageSessions && (
              <button
                onClick={() => setShowForm(true)}
                style={{
                  ...modernDesign.buttons.primary,
                  padding: '16px 32px',
                  fontSize: '16px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
                }}
              >
                ✨ Créer ma première session
              </button>
            )}
          </div>
        )}

        {/* Modern Quiz Assignment Modal */}
        {showQuizAssignment && (
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
            animation: 'modernFadeIn 0.3s ease-out'
          }}>
            <div style={{
              ...modernDesign.glass.card,
              width: '90%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: '32px',
              position: 'relative',
              animation: 'modernScale 0.4s ease-out'
            }}>
              {/* Modal Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px',
                paddingBottom: '16px',
                borderBottom: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                <h3 style={{
                  ...modernDesign.typography.subtitle,
                  fontSize: '24px',
                  margin: '0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{fontSize: '28px'}}>📝</span>
                  Gestion des Quiz
                </h3>
                <button
                  onClick={() => {
                    setShowQuizAssignment(false)
                    setSelectedSession('')
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '50%',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#9ca3af';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Quiz Assignment Form */}
              <div style={{
                display: 'grid',
                gap: '24px',
                marginBottom: '32px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '12px',
                    color: '#d1d5db',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}>
                    Sélectionner un quiz à assigner
                  </label>
                  <select
                    value={selectedQuizForAssignment}
                    onChange={(e) => setSelectedQuizForAssignment(e.target.value)}
                    style={{
                      ...modernDesign.inputs.modern,
                      width: '100%',
                      fontSize: '16px'
                    }}
                  >
                    <option value="">Choisir un quiz...</option>
                    {availableQuizzes.map((quiz) => (
                      <option key={quiz.id} value={quiz.id}>
                        {quiz.title} ({quiz._count?.questions || 0} questions)
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '16px'
                }}>
                  <button
                    onClick={handleAssignQuiz}
                    disabled={!selectedQuizForAssignment}
                    style={{
                      ...modernDesign.buttons.primary,
                      flex: '1',
                      padding: '16px 24px',
                      fontSize: '16px',
                      opacity: selectedQuizForAssignment ? 1 : 0.5,
                      cursor: selectedQuizForAssignment ? 'pointer' : 'not-allowed',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedQuizForAssignment) {
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedQuizForAssignment) {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
                      }
                    }}
                  >
                    ✨ Assigner le quiz
                  </button>
                </div>
              </div>

              {/* Assigned Quizzes List */}
              <div>
                <h4 style={{
                  ...modernDesign.typography.subtitle,
                  fontSize: '20px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{fontSize: '24px'}}>📋</span>
                  Quiz assignés à cette session
                </h4>
                
                {sessionQuizzes.length === 0 ? (
                  <div style={{
                    ...modernDesign.glass.card,
                    padding: '32px',
                    textAlign: 'center',
                    background: 'rgba(139, 92, 246, 0.05)',
                    border: '2px dashed rgba(139, 92, 246, 0.3)'
                  }}>
                    <div style={{
                      fontSize: '48px',
                      marginBottom: '16px',
                      opacity: 0.7
                    }}>
                      📝
                    </div>
                    <p style={{
                      ...modernDesign.typography.body,
                      margin: '0',
                      opacity: 0.8
                    }}>
                      Aucun quiz assigné à cette session
                    </p>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gap: '16px'
                  }}>
                    {sessionQuizzes.map((sessionQuiz, index) => (
                      <div
                        key={sessionQuiz.id}
                        style={{
                          ...modernDesign.glass.card,
                          padding: '20px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          animation: `modernSlideIn 0.3s ease-out ${index * 0.1}s both`
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <span style={{fontSize: '24px'}}>📝</span>
                          <div>
                            <h5 style={{
                              margin: '0 0 4px 0',
                              fontSize: '16px',
                              fontWeight: '600',
                              color: '#e5e7eb'
                            }}>
                              {sessionQuiz.quiz.title}
                            </h5>
                            <p style={{
                              margin: '0',
                              fontSize: '14px',
                              color: '#9ca3af'
                            }}>
                              {sessionQuiz.quiz._count?.questions || 0} questions
                              {sessionQuiz.isActive && (
                                <span style={{
                                  marginLeft: '8px',
                                  padding: '2px 6px',
                                  backgroundColor: 'rgba(34, 197, 94, 0.2)',
                                  color: '#22c55e',
                                  fontSize: '12px',
                                  borderRadius: '4px',
                                  fontWeight: '500'
                                }}>
                                  Actif
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'center'
                        }}>
                          <button
                            onClick={() => handleToggleQuizActivation(sessionQuiz.id, sessionQuiz.isActive)}
                            style={{
                              ...modernDesign.buttons.secondary,
                              background: sessionQuiz.isActive 
                                ? 'rgba(251, 146, 60, 0.1)' 
                                : 'rgba(34, 197, 94, 0.1)',
                              border: sessionQuiz.isActive 
                                ? '1px solid rgba(251, 146, 60, 0.3)' 
                                : '1px solid rgba(34, 197, 94, 0.3)',
                              color: sessionQuiz.isActive ? '#fb923c' : '#22c55e',
                              padding: '8px 16px',
                              fontSize: '14px',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = sessionQuiz.isActive 
                                ? 'rgba(251, 146, 60, 0.2)' 
                                : 'rgba(34, 197, 94, 0.2)';
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = sessionQuiz.isActive 
                                ? 'rgba(251, 146, 60, 0.1)' 
                                : 'rgba(34, 197, 94, 0.1)';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            {sessionQuiz.isActive ? '⏸️ Désactiver' : '▶️ Activer'}
                          </button>
                          
                          <button
                            onClick={() => handleUnassignQuiz(sessionQuiz.id)}
                            style={{
                              ...modernDesign.buttons.secondary,
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#fca5a5',
                              padding: '8px 16px',
                              fontSize: '14px',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            🗑️ Retirer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modern Session Details Modal */}
        {showSessionDetails && (
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
            animation: 'modernFadeIn 0.3s ease-out'
          }}>
            <div style={{
              ...modernDesign.glass.card,
              width: '95%',
              maxWidth: '1200px',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: '32px',
              position: 'relative',
              animation: 'modernScale 0.4s ease-out'
            }}>
              {/* Modal Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px',
                paddingBottom: '16px',
                borderBottom: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                <h3 style={{
                  ...modernDesign.typography.subtitle,
                  fontSize: '24px',
                  margin: '0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{fontSize: '28px'}}>👥</span>
                  Détails de la Session
                </h3>
                <button
                  onClick={() => {
                    setShowSessionDetails(false)
                    setSelectedSession('')
                    setSessionCandidates([])
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '50%',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#9ca3af';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Session Info */}
              {selectedSession && (
                <div style={{
                  ...modernDesign.glass.card,
                  padding: '24px',
                  marginBottom: '32px',
                  background: 'rgba(59, 130, 246, 0.05)',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                  {(() => {
                    const session = sessions.find(s => s.id === selectedSession);
                    if (!session) return null;
                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                        <div>
                          <h4 style={{ ...modernDesign.typography.subtitle, fontSize: '18px', margin: '0 0 8px 0' }}>
                            {session.name}
                          </h4>
                          <p style={{ color: '#9ca3af', margin: '0', fontSize: '14px' }}>
                            Session #{session.id}
                          </p>
                        </div>
                        <div>
                          <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#e5e7eb' }}>
                            📅 {new Date(session.date).toLocaleDateString('fr-FR')}
                          </p>
                          <p style={{ margin: '0', fontSize: '12px', color: '#9ca3af' }}>
                            {new Date(session.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div>
                          <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#e5e7eb' }}>
                            📍 {session.location}
                          </p>
                          <p style={{ margin: '0', fontSize: '12px', color: '#9ca3af' }}>
                            {session._count.candidates} / {session.maxCandidates} candidats
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Candidates List */}
              <div>
                <h4 style={{
                  ...modernDesign.typography.subtitle,
                  fontSize: '20px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{fontSize: '24px'}}>👨‍💼</span>
                  Candidats inscrits ({sessionCandidates.length})
                </h4>
                
                {sessionCandidates.length === 0 ? (
                  <div style={{
                    ...modernDesign.glass.card,
                    padding: '32px',
                    textAlign: 'center',
                    background: 'rgba(139, 92, 246, 0.05)',
                    border: '2px dashed rgba(139, 92, 246, 0.3)'
                  }}>
                    <div style={{
                      fontSize: '48px',
                      marginBottom: '16px',
                      opacity: 0.7
                    }}>
                      👥
                    </div>
                    <p style={{
                      ...modernDesign.typography.body,
                      margin: '0',
                      opacity: 0.8
                    }}>
                      Aucun candidat inscrit à cette session
                    </p>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gap: '16px'
                  }}>
                    {sessionCandidates.map((candidate: Candidate, index: number) => (
                      <div
                        key={candidate.id}
                        style={{
                          ...modernDesign.glass.card,
                          padding: '24px',
                          display: 'grid',
                          gridTemplateColumns: '1fr auto',
                          gap: '20px',
                          alignItems: 'center',
                          animation: `modernSlideIn 0.3s ease-out ${index * 0.1}s both`
                        }}
                      >
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '16px'
                        }}>
                          <div>
                            <h5 style={{
                              margin: '0 0 4px 0',
                              fontSize: '18px',
                              fontWeight: '600',
                              color: '#e5e7eb',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <span style={{fontSize: '20px'}}>👤</span>
                              {candidate.firstName} {candidate.lastName}
                            </h5>
                            <p style={{
                              margin: '0',
                              fontSize: '14px',
                              color: '#9ca3af'
                            }}>
                              {candidate.email}
                            </p>
                            {candidate.phone && (
                              <p style={{
                                margin: '4px 0 0 0',
                                fontSize: '14px',
                                color: '#9ca3af'
                              }}>
                                📞 {candidate.phone}
                              </p>
                            )}
                          </div>
                          
                          <div>
                            <p style={{
                              margin: '0 0 4px 0',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#e5e7eb'
                            }}>
                              📅 Inscrit le
                            </p>
                            <p style={{
                              margin: '0',
                              fontSize: '14px',
                              color: '#9ca3af'
                            }}>
                              {new Date(candidate.registeredAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>

                          <div>
                            <p style={{
                              margin: '0 0 4px 0',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#e5e7eb'
                            }}>
                              🎯 Entretien
                            </p>
                            {candidate.interview ? (
                              <div>
                                <div style={{
                                  ...modernDesign.badges[
                                    candidate.interview.status === 'COMPLETED' ? 'success' :
                                    candidate.interview.status === 'IN_PROGRESS' ? 'warning' : 'info'
                                  ],
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  marginBottom: '4px'
                                }}>
                                  {candidate.interview.status === 'COMPLETED' ? '✅ Terminé' :
                                   candidate.interview.status === 'IN_PROGRESS' ? '🔄 En cours' : '📋 Planifié'}
                                </div>
                                {candidate.interview.completedAt && (
                                  <p style={{ margin: '0', fontSize: '12px', color: '#9ca3af' }}>
                                    {new Date(candidate.interview.completedAt).toLocaleDateString('fr-FR')}
                                  </p>
                                )}
                                {candidate.interview.conductedBy && (
                                  <p style={{ margin: '0', fontSize: '12px', color: '#9ca3af' }}>
                                    Par: {candidate.interview.conductedBy}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div style={{
                                ...modernDesign.badges.info,
                                fontSize: '12px',
                                fontWeight: '600',
                                opacity: 0.7
                              }}>
                                ⏳ Non planifié
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Interview Actions */}
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          minWidth: '200px'
                        }}>
                          {candidate.interview && candidate.interview.status === 'COMPLETED' ? (
                            <>
                              <button
                                onClick={() => handleViewInterviewReport(candidate.id, selectedSession)}
                                style={{
                                  ...modernDesign.buttons.secondary,
                                  background: 'rgba(16, 185, 129, 0.1)',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                  color: '#6ee7b7',
                                  padding: '10px 16px',
                                  fontSize: '14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  justifyContent: 'center',
                                  transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
                                  e.currentTarget.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                              >
                                <span style={{fontSize: '16px'}}>📄</span>
                                <span>Voir le compte-rendu</span>
                              </button>
                              
                              <button
                                onClick={() => handleViewCandidateQuizzes(candidate.id, selectedSession)}
                                style={{
                                  ...modernDesign.buttons.secondary,
                                  background: 'rgba(139, 92, 246, 0.1)',
                                  border: '1px solid rgba(139, 92, 246, 0.3)',
                                  color: '#c4b5fd',
                                  padding: '10px 16px',
                                  fontSize: '14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  justifyContent: 'center',
                                  transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                                  e.currentTarget.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                              >
                                <span style={{fontSize: '16px'}}>📝</span>
                                <span>Voir les quiz</span>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleConductInterview(candidate.id, selectedSession)}
                              style={{
                                ...modernDesign.buttons.secondary,
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                color: '#93c5fd',
                                padding: '10px 16px',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                justifyContent: 'center',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                                e.currentTarget.style.transform = 'scale(1.05)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              <span style={{fontSize: '16px'}}>🎤</span>
                              <span>
                                {candidate.interview ? 'Continuer l\'entretien' : 'Commencer l\'entretien'}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
