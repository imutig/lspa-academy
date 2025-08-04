'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import AcademyManagement from '@/components/AcademyManagement'

interface SessionData {
  id: string
  name: string
  description?: string
  date?: string
  location?: string
  maxCandidates?: number
  status: string
  sessionQuizzes: Array<{
    id: string
    quiz: {
      id: string
      title: string
      description?: string
      timeLimit: number
    }
    isActive: boolean
  }>
}

export default function SessionDetailsPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string

  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (sessionId) {
      fetchSessionData()
    }
  }, [sessionId])

  const fetchSessionData = async () => {
    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setSessionData(data)
      } else {
        setError('Erreur lors du chargement de la session')
      }
    } catch (err) {
      console.error('Erreur:', err)
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-white">Redirection...</p>
      </div>
    )
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
          borderRadius: '20px',
          padding: '48px',
          border: '1px solid rgba(75, 85, 99, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(59, 130, 246, 0.3)',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 24px auto'
          }}></div>
          <p style={{
            color: '#e5e7eb',
            fontSize: '18px',
            fontWeight: '500',
            margin: 0
          }}>
            Chargement des détails...
          </p>
        </div>
        <style>
          {`
            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }
          `}
        </style>
      </div>
    )
  }

  if (error) {
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
          <div style={{ marginBottom: '32px' }}>
            <Link
              href="/admin/sessions"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: 'rgba(31, 41, 55, 0.8)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(75, 85, 99, 0.3)',
                borderRadius: '12px',
                color: '#e5e7eb',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              ← Retour aux sessions
            </Link>
          </div>
          
          <div style={{
            background: 'rgba(17, 24, 39, 0.8)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '48px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '24px'
            }}>
              ⚠️
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#ef4444',
              margin: '0 0 16px 0'
            }}>
              Erreur de chargement
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#fca5a5',
              margin: 0
            }}>
              {error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!sessionData) {
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
          <div style={{ marginBottom: '32px' }}>
            <Link
              href="/admin/sessions"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: 'rgba(31, 41, 55, 0.8)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(75, 85, 99, 0.3)',
                borderRadius: '12px',
                color: '#e5e7eb',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              ← Retour aux sessions
            </Link>
          </div>
          
          <div style={{
            background: 'rgba(17, 24, 39, 0.8)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '48px',
            border: '1px solid rgba(251, 146, 60, 0.3)',
            boxShadow: '0 8px 32px rgba(251, 146, 60, 0.2)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '24px'
            }}>
              🔍
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#fb923c',
              margin: '0 0 16px 0'
            }}>
              Session non trouvée
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#fdba74',
              margin: 0
            }}>
              La session demandée n'existe pas ou a été supprimée.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Préparer les données des quiz pour le composant AcademyManagement
  const sessionQuizzes = sessionData.sessionQuizzes.map(sq => ({
    id: sq.quiz.id,
    title: sq.quiz.title,
    isActive: sq.isActive
  }))

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000000 0%, #111827 50%, #1f2937 100%)',
      position: 'relative'
    }}>
      {/* Effets de fond décoratifs */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />
      
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '32px 16px'
      }}>
        {/* Navigation avec style moderne */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto 32px auto'
        }}>
          <Link
            href="/admin/sessions"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: 'rgba(31, 41, 55, 0.8)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(75, 85, 99, 0.3)',
              borderRadius: '12px',
              color: '#e5e7eb',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(31, 41, 55, 0.8)'
              e.currentTarget.style.borderColor = 'rgba(75, 85, 99, 0.3)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)'
            }}
          >
            ← Retour aux sessions
          </Link>
        </div>
        
        <AcademyManagement
          sessionId={sessionId}
          sessionName={sessionData.name}
          sessionQuizzes={sessionQuizzes}
        />
      </div>
    </div>
  )
}
