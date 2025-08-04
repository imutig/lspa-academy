'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  username: string
  email?: string
  firstName?: string
  lastName?: string
}

interface SessionCandidate {
  id: string
  userId: string
  matricule: string | null
  status: string
  createdAt: string
  user: User
}

interface SessionQuiz {
  id: string
  isActive: boolean
  quiz: {
    id: string
    title: string
    description: string
    _count: {
      questions: number
      attempts: number
    }
  }
}

interface Interview {
  id: string
  candidateId: string
  interviewerId: string
  decision: string | null
  notes: string | null
  createdAt: string
  candidate: {
    username: string
    firstName?: string
    lastName?: string
  }
  interviewer: {
    username: string
    firstName?: string
    lastName?: string
  }
}

interface SessionDetails {
  id: string
  name: string
  description: string | null
  date: string | null
  location: string | null
  maxCandidates: number | null
  status: string
  candidates: SessionCandidate[]
  sessionQuizzes: SessionQuiz[]
  interviews: Interview[]
  _count: {
    candidates: number
    interviews: number
  }
}

interface SessionDetailViewProps {
  sessionId: string
  onClose: () => void
}

export default function SessionDetailView({ sessionId, onClose }: SessionDetailViewProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [sessionData, setSessionData] = useState<SessionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showInterviewModal, setShowInterviewModal] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<SessionCandidate | null>(null)

  useEffect(() => {
    fetchSessionDetails()
  }, [sessionId])

  const fetchSessionDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sessions/${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setSessionData(data)
      } else {
        setError('Erreur lors du chargement de la session')
      }
    } catch (error) {
      console.error('Erreur:', error)
      setError('Erreur lors du chargement de la session')
    } finally {
      setLoading(false)
    }
  }

  const updateCandidateMatricule = async (candidateId: string, matricule: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          candidateId,
          matricule: matricule || null
        })
      })

      if (response.ok) {
        fetchSessionDetails() // Recharger les données
      } else {
        alert('Erreur lors de la mise à jour du matricule')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la mise à jour du matricule')
    }
  }

  const updateCandidateStatus = async (candidateId: string, status: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          candidateId,
          candidateStatus: status
        })
      })

      if (response.ok) {
        fetchSessionDetails() // Recharger les données
      } else {
        alert('Erreur lors de la mise à jour du statut')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la mise à jour du statut')
    }
  }

  const startInterview = (candidate: SessionCandidate) => {
    setSelectedCandidate(candidate)
    setShowInterviewModal(true)
  }

  const filteredCandidates = sessionData?.candidates.filter(candidate => {
    if (!searchTerm.trim()) return true
    
    return (
      (candidate.user.username && candidate.user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (candidate.user.email && candidate.user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (candidate.user.firstName && candidate.user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (candidate.user.lastName && candidate.user.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (candidate.matricule && candidate.matricule.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }) || []

  if (loading) {
    return (
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
        zIndex: 1000
      }}>
        <div style={{
          background: 'rgba(17, 24, 39, 0.9)',
          borderRadius: '16px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(59, 130, 246, 0.3)',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: 'white', fontSize: '18px' }}>Chargement des détails...</p>
        </div>
      </div>
    )
  }

  if (error || !sessionData) {
    return (
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
        zIndex: 1000
      }}>
        <div style={{
          background: 'rgba(17, 24, 39, 0.9)',
          borderRadius: '16px',
          padding: '32px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#ef4444', fontSize: '18px', marginBottom: '16px' }}>
            {error || 'Session non trouvée'}
          </p>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      zIndex: 1000,
      overflow: 'auto'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '20px auto',
        background: 'rgba(17, 24, 39, 0.95)',
        borderRadius: '16px',
        padding: '32px',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(75, 85, 99, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(75, 85, 99, 0.3)'
        }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: 'white',
              margin: 0,
              marginBottom: '8px'
            }}>
              {sessionData.name}
            </h1>
            <p style={{
              color: '#9ca3af',
              margin: 0,
              fontSize: '16px'
            }}>
              {sessionData.description || 'Aucune description'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 12px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ✕ Fermer
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
              {sessionData._count.candidates}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '14px' }}>Candidats inscrits</div>
          </div>
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
              {sessionData.sessionQuizzes.filter(sq => sq.isActive).length}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '14px' }}>Quiz actifs</div>
          </div>
          <div style={{
            background: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#a855f7' }}>
              {sessionData._count.interviews}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '14px' }}>Entretiens</div>
          </div>
        </div>

        {/* Recherche */}
        <div style={{ marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="Rechercher un candidat (nom, email, matricule)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'rgba(31, 41, 55, 0.8)',
              border: '1px solid rgba(75, 85, 99, 0.3)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '16px'
            }}
          />
        </div>

        {/* Liste des candidats */}
        <div style={{
          background: 'rgba(31, 41, 55, 0.5)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '16px'
          }}>
            Candidats ({filteredCandidates.length})
          </h2>

          <div style={{
            display: 'grid',
            gap: '12px'
          }}>
            {filteredCandidates.map((candidate) => (
              <div
                key={candidate.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 150px 120px 100px 120px',
                  gap: '16px',
                  alignItems: 'center',
                  padding: '16px',
                  background: 'rgba(17, 24, 39, 0.6)',
                  borderRadius: '8px',
                  border: '1px solid rgba(75, 85, 99, 0.3)'
                }}
              >
                <input
                  type="text"
                  value={candidate.matricule || ''}
                  placeholder="Mat."
                  onChange={(e) => {
                    const newMatricule = e.target.value
                    // Mise à jour immédiate de l'affichage
                    const updatedCandidates = sessionData.candidates.map(c =>
                      c.id === candidate.id ? { ...c, matricule: newMatricule } : c
                    )
                    setSessionData({ ...sessionData, candidates: updatedCandidates })
                  }}
                  onBlur={(e) => {
                    updateCandidateMatricule(candidate.userId, e.target.value)
                  }}
                  style={{
                    padding: '6px 8px',
                    background: 'rgba(31, 41, 55, 0.8)',
                    border: '1px solid rgba(75, 85, 99, 0.5)',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}
                />

                <div>
                  <div style={{ color: 'white', fontWeight: '500' }}>
                    {candidate.user.firstName && candidate.user.lastName ? `${candidate.user.firstName} ${candidate.user.lastName}` : candidate.user.username}
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '12px' }}>
                    {candidate.user.email}
                  </div>
                </div>

                <select
                  value={candidate.status}
                  onChange={(e) => updateCandidateStatus(candidate.userId, e.target.value)}
                  style={{
                    padding: '6px 8px',
                    background: 'rgba(31, 41, 55, 0.8)',
                    border: '1px solid rgba(75, 85, 99, 0.5)',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '12px'
                  }}
                >
                  <option value="REGISTERED">Inscrit</option>
                  <option value="VALIDATED">Validé</option>
                  <option value="IN_INTERVIEW">En entretien</option>
                  <option value="INTERVIEWED">Interviewé</option>
                  <option value="QUIZ_READY">Quiz prêt</option>
                  <option value="QUIZ_COMPLETED">Quiz terminé</option>
                  <option value="PASSED">Admis</option>
                  <option value="FAILED">Refusé</option>
                </select>

                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      updateCandidateStatus(candidate.userId, e.target.value)
                      e.target.value = '' // Reset selection
                    }
                  }}
                  style={{
                    padding: '6px 8px',
                    background: 'rgba(31, 41, 55, 0.8)',
                    border: '1px solid rgba(75, 85, 99, 0.5)',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '12px'
                  }}
                >
                  <option value="">Évaluation</option>
                  <option value="FAVORABLE">Favorable</option>
                  <option value="A_SURVEILLER">À surveiller</option>
                  <option value="DEFAVORABLE">Défavorable</option>
                </select>

                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '500',
                  background: candidate.status === 'PASSED' ? 'rgba(34, 197, 94, 0.2)' :
                             candidate.status === 'FAILED' ? 'rgba(239, 68, 68, 0.2)' :
                             candidate.status === 'IN_INTERVIEW' ? 'rgba(59, 130, 246, 0.2)' :
                             'rgba(156, 163, 175, 0.2)',
                  color: candidate.status === 'PASSED' ? '#22c55e' :
                         candidate.status === 'FAILED' ? '#ef4444' :
                         candidate.status === 'IN_INTERVIEW' ? '#3b82f6' :
                         '#9ca3af'
                }}>
                  {candidate.status}
                </span>

                <button
                  onClick={() => startInterview(candidate)}
                  disabled={candidate.status === 'IN_INTERVIEW'}
                  style={{
                    padding: '6px 12px',
                    background: candidate.status === 'IN_INTERVIEW' ? 
                      'rgba(156, 163, 175, 0.3)' : 'rgba(59, 130, 246, 0.2)',
                    border: `1px solid ${candidate.status === 'IN_INTERVIEW' ? 
                      'rgba(156, 163, 175, 0.5)' : 'rgba(59, 130, 246, 0.5)'}`,
                    borderRadius: '6px',
                    color: candidate.status === 'IN_INTERVIEW' ? '#9ca3af' : '#3b82f6',
                    fontSize: '12px',
                    cursor: candidate.status === 'IN_INTERVIEW' ? 'not-allowed' : 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {candidate.status === 'IN_INTERVIEW' ? 'En cours' : 'Entretien'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Modal d'entretien */}
        {showInterviewModal && selectedCandidate && (
          <InterviewModal
            candidate={selectedCandidate}
            sessionId={sessionId}
            onClose={() => {
              setShowInterviewModal(false)
              setSelectedCandidate(null)
              fetchSessionDetails() // Recharger les données
            }}
          />
        )}
      </div>
    </div>
  )
}

// Composant modal d'entretien
interface InterviewModalProps {
  candidate: SessionCandidate
  sessionId: string
  onClose: () => void
}

function InterviewModal({ candidate, sessionId, onClose }: InterviewModalProps) {
  const { data: session } = useSession()
  const [notes, setNotes] = useState('')
  const [decision, setDecision] = useState('')
  const [loading, setLoading] = useState(false)

  const submitInterview = async () => {
    if (!decision) {
      alert('Veuillez sélectionner une décision')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/interviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          candidateId: candidate.userId,
          interviewerId: session?.user?.id,
          decision,
          notes
        })
      })

      if (response.ok) {
        alert('Entretien enregistré avec succès')
        onClose()
      } else {
        alert('Erreur lors de l\'enregistrement de l\'entretien')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'enregistrement de l\'entretien')
    } finally {
      setLoading(false)
    }
  }

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
      zIndex: 1100
    }}>
      <div style={{
        width: '600px',
        maxHeight: '80vh',
        background: 'rgba(17, 24, 39, 0.95)',
        borderRadius: '16px',
        padding: '32px',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(75, 85, 99, 0.3)',
        overflow: 'auto'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '24px'
        }}>
          Entretien - {candidate.user.firstName && candidate.user.lastName ? `${candidate.user.firstName} ${candidate.user.lastName}` : candidate.user.username}
        </h2>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            color: 'white',
            fontSize: '16px',
            fontWeight: '500',
            marginBottom: '8px'
          }}>
            Décision :
          </label>
          <select
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(31, 41, 55, 0.8)',
              border: '1px solid rgba(75, 85, 99, 0.5)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '16px'
            }}
          >
            <option value="">Sélectionner une décision</option>
            <option value="FAVORABLE">Favorable</option>
            <option value="A_SURVEILLER">À surveiller</option>
            <option value="DEFAVORABLE">Défavorable</option>
          </select>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            color: 'white',
            fontSize: '16px',
            fontWeight: '500',
            marginBottom: '8px'
          }}>
            Notes :
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Vos observations sur le candidat..."
            rows={6}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(31, 41, 55, 0.8)',
              border: '1px solid rgba(75, 85, 99, 0.5)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '16px',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: 'rgba(75, 85, 99, 0.5)',
              border: '1px solid rgba(75, 85, 99, 0.7)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Annuler
          </button>
          <button
            onClick={submitInterview}
            disabled={loading || !decision}
            style={{
              padding: '12px 24px',
              background: loading || !decision ? 
                'rgba(156, 163, 175, 0.3)' : 'rgba(34, 197, 94, 0.2)',
              border: `1px solid ${loading || !decision ? 
                'rgba(156, 163, 175, 0.5)' : 'rgba(34, 197, 94, 0.5)'}`,
              borderRadius: '8px',
              color: loading || !decision ? '#9ca3af' : '#22c55e',
              fontSize: '16px',
              cursor: loading || !decision ? 'not-allowed' : 'pointer',
              fontWeight: '500'
            }}
          >
            {loading ? 'Enregistrement...' : 'Terminer l\'entretien'}
          </button>
        </div>
      </div>
    </div>
  )
}
