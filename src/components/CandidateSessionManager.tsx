'use client'

import { useState, useEffect } from 'react'

interface Candidate {
  id: string
  user: {
    id: string
    username: string
    email: string
    matricule?: string
    firstName?: string
    lastName?: string
  }
  matricule?: string
  status: 'REGISTERED' | 'VALIDATED' | 'IN_INTERVIEW' | 'INTERVIEWED' | 'QUIZ_READY' | 'QUIZ_COMPLETED' | 'PASSED' | 'FAILED'
  createdAt: string
}

interface Session {
  id: string
  name: string
  status: string
}

interface CandidateSessionManagerProps {
  userRole: string
}

export default function CandidateSessionManager({ userRole }: CandidateSessionManagerProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState<string>('')

  useEffect(() => {
    fetchSessions()
  }, [])

  useEffect(() => {
    if (selectedSession) {
      fetchCandidates()
    }
  }, [selectedSession])

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data.filter((s: Session) => s.status !== 'CLOSED'))
      }
    } catch (error) {
      setError('Erreur lors du chargement des sessions')
    }
  }

  const fetchCandidates = async () => {
    if (!selectedSession) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/sessions/${selectedSession}/candidates`)
      if (response.ok) {
        const data = await response.json()
        setCandidates(data)
      } else {
        setError('Erreur lors du chargement des candidats')
      }
    } catch (error) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const updateCandidateStatus = async (candidateId: string, status: string) => {
    try {
      const response = await fetch(`/api/sessions/${selectedSession}/candidates/${candidateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        fetchCandidates()
      } else {
        setError('Erreur lors de la mise à jour du statut')
      }
    } catch (error) {
      setError('Erreur de connexion')
    }
  }

  const assignMatricule = async (candidateId: string, matricule: string) => {
    try {
      const response = await fetch('/api/admin/matricules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          userId: candidates.find(c => c.id === candidateId)?.user.id,
          matricule 
        })
      })

      if (response.ok) {
        fetchCandidates()
      } else {
        setError('Erreur lors de l\'attribution du matricule')
      }
    } catch (error) {
      setError('Erreur de connexion')
    }
  }

  const selectCandidateForInterview = async (candidateId: string) => {
    if (selectedCandidate === candidateId) {
      setSelectedCandidate('')
      return
    }

    setSelectedCandidate(candidateId)
    
    // Mettre à jour le statut vers IN_INTERVIEW
    await updateCandidateStatus(candidateId, 'IN_INTERVIEW')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REGISTERED': return '#6b7280'
      case 'VALIDATED': return '#3b82f6'
      case 'IN_INTERVIEW': return '#f59e0b'
      case 'INTERVIEWED': return '#8b5cf6'
      case 'QUIZ_READY': return '#06b6d4'
      case 'QUIZ_COMPLETED': return '#10b981'
      case 'PASSED': return '#22c55e'
      case 'FAILED': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'REGISTERED': return 'Inscrit'
      case 'VALIDATED': return 'Validé'
      case 'IN_INTERVIEW': return 'En entretien'
      case 'INTERVIEWED': return 'Entretien terminé'
      case 'QUIZ_READY': return 'Prêt pour le quiz'
      case 'QUIZ_COMPLETED': return 'Quiz terminé'
      case 'PASSED': return 'Réussi'
      case 'FAILED': return 'Échoué'
      default: return status
    }
  }

  const canValidateCandidates = ['INSTRUCTEUR', 'SUPERVISEUR', 'DIRECTEUR'].includes(userRole)
  const canAssignMatricules = ['INSTRUCTEUR', 'SUPERVISEUR', 'DIRECTEUR'].includes(userRole)

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: '24px',
      border: '1px solid rgba(148, 163, 184, 0.1)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    }}>
      <h2 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: '24px'
      }}>
        Gestion des Candidats
      </h2>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          padding: '12px',
          color: '#fca5a5',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px' }}>
          Sélectionner une session
        </label>
        <select
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
          style={{
            width: '100%',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            color: '#f8fafc',
            fontSize: '14px'
          }}
        >
          <option value="">-- Choisir une session --</option>
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.name} ({session.status})
            </option>
          ))}
        </select>
      </div>

      {selectedSession && (
        <div>
          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#94a3b8', 
              padding: '40px' 
            }}>
              Chargement des candidats...
            </div>
          ) : candidates.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#94a3b8', 
              padding: '40px',
              fontStyle: 'italic'
            }}>
              Aucun candidat inscrit dans cette session
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  style={{
                    background: selectedCandidate === candidate.id 
                      ? 'rgba(59, 130, 246, 0.2)' 
                      : 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: selectedCandidate === candidate.id 
                      ? '2px solid #3b82f6' 
                      : '1px solid rgba(148, 163, 184, 0.2)',
                    transition: 'all 0.2s ease',
                    cursor: canValidateCandidates ? 'pointer' : 'default'
                  }}
                  onClick={() => canValidateCandidates && selectCandidateForInterview(candidate.id)}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <h4 style={{
                        color: '#f8fafc',
                        fontSize: '16px',
                        fontWeight: '600',
                        margin: '0 0 4px 0'
                      }}>
                        {candidate.user.firstName && candidate.user.lastName ? `${candidate.user.firstName} ${candidate.user.lastName}` : candidate.user.username}
                      </h4>
                      <p style={{
                        color: '#94a3b8',
                        fontSize: '14px',
                        margin: '0 0 8px 0'
                      }}>
                        {candidate.user.email}
                      </p>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <span style={{
                          background: getStatusColor(candidate.status) + '20',
                          color: getStatusColor(candidate.status),
                          padding: '4px 8px',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {getStatusText(candidate.status)}
                        </span>
                        {candidate.user.matricule && (
                          <span style={{
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: '#10b981',
                            padding: '4px 8px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            #{candidate.user.matricule}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {!candidate.user.matricule && canAssignMatricules && (
                        <input
                          type="text"
                          placeholder="Matricule"
                          style={{
                            background: 'rgba(30, 41, 59, 0.8)',
                            border: '1px solid rgba(148, 163, 184, 0.3)',
                            borderRadius: '6px',
                            padding: '6px 8px',
                            color: '#f8fafc',
                            fontSize: '12px',
                            width: '80px'
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              assignMatricule(candidate.id, e.currentTarget.value)
                              e.currentTarget.value = ''
                            }
                          }}
                        />
                      )}
                      {canValidateCandidates && candidate.status === 'REGISTERED' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateCandidateStatus(candidate.id, 'VALIDATED')
                          }}
                          style={{
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Valider
                        </button>
                      )}
                      {canValidateCandidates && candidate.status === 'INTERVIEWED' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateCandidateStatus(candidate.id, 'QUIZ_READY')
                          }}
                          style={{
                            background: '#06b6d4',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Prêt pour Quiz
                        </button>
                      )}
                    </div>
                  </div>
                  {selectedCandidate === candidate.id && (
                    <div style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      borderRadius: '8px',
                      padding: '12px',
                      marginTop: '12px',
                      border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}>
                      <p style={{
                        color: '#93c5fd',
                        fontSize: '14px',
                        margin: 0,
                        fontWeight: '500'
                      }}>
                        ✅ Candidat sélectionné pour l'entretien
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
