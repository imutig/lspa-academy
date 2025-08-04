'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Session {
  id: string
  name: string
  description?: string
  status: 'PLANNED' | 'ACTIVE' | 'CLOSED'
  createdAt: string
  _count: {
    candidates: number
  }
}

interface Registration {
  id: string
  sessionId: string
  status: string
  createdAt: string
  session: {
    id: string
    name: string
    status: string
  }
}

export default function CandidateSessionList() {
  const { data: session } = useSession()
  const [sessions, setSessions] = useState<Session[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Récupérer les sessions disponibles
      const sessionsResponse = await fetch('/api/sessions')
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json()
        setSessions(sessionsData.filter((s: Session) => s.status !== 'CLOSED'))
      }

      // Récupérer les inscriptions du candidat
      if (session?.user.id) {
        const registrationsResponse = await fetch(`/api/candidate/registrations`)
        if (registrationsResponse.ok) {
          const registrationsData = await registrationsResponse.json()
          setRegistrations(registrationsData)
        }
      }
    } catch (error) {
      setError('Erreur lors du chargement des données')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const registerForSession = async (sessionId: string) => {
    try {
      const response = await fetch('/api/sessions/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId })
      })

      if (response.ok) {
        fetchData() // Rechargement des données
        setError('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erreur lors de l\'inscription')
      }
    } catch (error) {
      setError('Erreur de connexion')
    }
  }

  const isRegistered = (sessionId: string) => {
    return registrations.some(reg => reg.sessionId === sessionId)
  }

  const getRegistrationStatus = (sessionId: string) => {
    const registration = registrations.find(reg => reg.sessionId === sessionId)
    return registration?.status
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED': return '#3b82f6'
      case 'ACTIVE': return '#10b981'
      case 'CLOSED': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'Planifiée'
      case 'ACTIVE': return 'Active'
      case 'CLOSED': return 'Fermée'
      default: return status
    }
  }

  const getCandidateStatusColor = (status?: string) => {
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

  const getCandidateStatusText = (status?: string) => {
    switch (status) {
      case 'REGISTERED': return 'Inscrit'
      case 'VALIDATED': return 'Validé'
      case 'IN_INTERVIEW': return 'En entretien'
      case 'INTERVIEWED': return 'Entretien terminé'
      case 'QUIZ_READY': return 'Prêt pour le quiz'
      case 'QUIZ_COMPLETED': return 'Quiz terminé'
      case 'PASSED': return 'Réussi'
      case 'FAILED': return 'Échoué'
      default: return 'Inconnu'
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        color: '#e5e7eb'
      }}>
        Chargement des sessions...
      </div>
    )
  }

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
        Sessions Police Academy
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

      <div style={{ display: 'grid', gap: '16px' }}>
        {sessions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#94a3b8',
            padding: '40px',
            fontStyle: 'italic'
          }}>
            Aucune session disponible pour le moment
          </div>
        ) : (
          sessions.map((sess) => {
            const registered = isRegistered(sess.id)
            const candidateStatus = getRegistrationStatus(sess.id)
            
            return (
              <div
                key={sess.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      color: '#f8fafc',
                      fontSize: '18px',
                      fontWeight: '600',
                      margin: '0 0 4px 0'
                    }}>
                      {sess.name}
                    </h3>
                    {sess.description && (
                      <p style={{
                        color: '#94a3b8',
                        fontSize: '14px',
                        margin: '0 0 8px 0'
                      }}>
                        {sess.description}
                      </p>
                    )}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      fontSize: '14px',
                      color: '#cbd5e1'
                    }}>
                      <span>👥 {sess._count.candidates} candidats</span>
                      <span>📅 {new Date(sess.createdAt).toLocaleDateString()}</span>
                      <span style={{
                        background: getStatusColor(sess.status) + '20',
                        color: getStatusColor(sess.status),
                        padding: '4px 8px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {getStatusText(sess.status)}
                      </span>
                    </div>
                    {registered && candidateStatus && (
                      <div style={{
                        marginTop: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                          Votre statut:
                        </span>
                        <span style={{
                          background: getCandidateStatusColor(candidateStatus) + '20',
                          color: getCandidateStatusColor(candidateStatus),
                          padding: '4px 8px',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {getCandidateStatusText(candidateStatus)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    {registered ? (
                      <span style={{
                        background: 'rgba(34, 197, 94, 0.2)',
                        color: '#22c55e',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        border: '1px solid rgba(34, 197, 94, 0.3)'
                      }}>
                        ✅ Inscrit
                      </span>
                    ) : (
                      <button
                        onClick={() => registerForSession(sess.id)}
                        disabled={sess.status === 'CLOSED'}
                        style={{
                          background: sess.status === 'CLOSED' 
                            ? 'rgba(107, 114, 128, 0.3)' 
                            : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          color: sess.status === 'CLOSED' ? '#9ca3af' : 'white',
                          border: 'none',
                          borderRadius: '20px',
                          padding: '10px 20px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: sess.status === 'CLOSED' ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: sess.status === 'CLOSED' 
                            ? 'none' 
                            : '0 4px 12px rgba(59, 130, 246, 0.3)'
                        }}
                        onMouseOver={(e) => {
                          if (sess.status !== 'CLOSED') {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)'
                          }
                        }}
                        onMouseOut={(e) => {
                          if (sess.status !== 'CLOSED') {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
                          }
                        }}
                      >
                        {sess.status === 'CLOSED' ? 'Session fermée' : 'S\'inscrire'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
