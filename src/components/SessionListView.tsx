'use client'

import { useState, useEffect } from 'react'
import { modernDesign } from '../utils/modernDesign'
import SessionDetailView from './SessionDetailView'

interface Session {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
  _count: {
    candidates: number
    quizzes: number
  }
}

export default function SessionListView() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    fetchSessions()
    setTimeout(() => setIsLoaded(true), 100)
  }, [])

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/admin/sessions')
      const data = await response.json()
      
      if (response.ok) {
        setSessions(data.sessions || [])
      } else {
        console.error('Erreur:', data.error)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des sessions:', error)
    } finally {
      setLoading(false)
    }
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
      
      @keyframes modernRotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  )

  if (selectedSessionId) {
    return (
      <>
        {styles}
        <SessionDetailView 
          sessionId={selectedSessionId} 
          onClose={() => setSelectedSessionId(null)} 
        />
      </>
    )
  }

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
            <h1 style={{
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
              }}>📋</span>
              Détails des Sessions
            </h1>
            <p style={{
              ...modernDesign.typography.body,
              fontSize: '16px',
              margin: '0'
            }}>
              Consultez les détails complets de chaque session
            </p>
          </div>
        </div>

        {/* Sessions Grid */}
        <div style={{
          display: 'grid',
          gap: '20px'
        }}>
          {sessions.length === 0 ? (
            <div style={{
              ...modernDesign.glass.card,
              padding: '48px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '64px',
                marginBottom: '16px',
                opacity: 0.5
              }}>
                📚
              </div>
              <p style={{
                ...modernDesign.typography.body,
                fontSize: '18px',
                margin: '0'
              }}>
                Aucune session trouvée
              </p>
            </div>
          ) : (
            sessions.map((session, index) => (
              <div
                key={session.id}
                style={{
                  ...modernDesign.glass.card,
                  padding: '24px',
                  cursor: 'pointer',
                  animation: `modernSlideIn 0.5s ease-out ${index * 0.1}s both`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => setSelectedSessionId(session.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'
                  e.currentTarget.style.boxShadow = '0 16px 40px rgba(59, 130, 246, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)'
                }}
              >
                {/* Status Badge */}
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: session.isActive 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  boxShadow: session.isActive
                    ? '0 4px 15px rgba(16, 185, 129, 0.3)'
                    : '0 4px 15px rgba(239, 68, 68, 0.3)'
                }}>
                  {session.isActive ? '🟢 Active' : '🔴 Inactive'}
                </div>

                <div style={{
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'flex-start'
                }}>
                  {/* Session Icon */}
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)'
                  }}>
                    📚
                  </div>

                  {/* Session Info */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      ...modernDesign.typography.subtitle,
                      fontSize: '20px',
                      margin: '0 0 8px 0',
                      color: '#e5e7eb'
                    }}>
                      {session.title}
                    </h3>
                    
                    <p style={{
                      ...modernDesign.typography.body,
                      color: '#9ca3af',
                      margin: '0 0 16px 0',
                      lineHeight: '1.5'
                    }}>
                      {session.description}
                    </p>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '12px',
                      fontSize: '14px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#d1d5db'
                      }}>
                        <span>📅</span>
                        <span>Début: {new Date(session.startDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#d1d5db'
                      }}>
                        <span>🏁</span>
                        <span>Fin: {new Date(session.endDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#d1d5db'
                      }}>
                        <span>👥</span>
                        <span>{session._count.candidates} candidat{session._count.candidates !== 1 ? 's' : ''}</span>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#d1d5db'
                      }}>
                        <span>📝</span>
                        <span>{session._count.quizzes} quiz{session._count.quizzes !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: '#3b82f6',
                    fontSize: '16px',
                    transition: 'all 0.3s ease'
                  }}>
                    →
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
