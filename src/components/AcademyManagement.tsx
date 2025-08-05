'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Users, Clock, CheckCircle2, AlertTriangle, X, RotateCcw, Play, UserX } from 'lucide-react'
import InterviewModal from './InterviewModal'
import InterviewReportModal from './InterviewReportModal'

type CandidateStatus = 'REGISTERED' | 'EN_ATTENTE' | 'FAVORABLE' | 'A_SURVEILLER' | 'DEFAVORABLE'
type InterviewDecision = 'FAVORABLE' | 'DEFAVORABLE' | 'A_SURVEILLER'

interface CandidateMonitoring {
  candidateId: string
  matricule: string | null
  fullName: string
  username: string
  status: CandidateStatus
  interviewStatus?: {
    inProgress: boolean
    completed: boolean
    interviewer: string | null
    decision?: InterviewDecision
  }
  activeQuiz?: {
    quizId: string
    quizTitle: string
    startedAt: Date
    timeRemaining: number
    currentScore: number
    questionsAnswered: number
    lastActivity: Date
  }
  lastQuizAttempt?: {
    quizTitle: string
    completed: boolean
    score: number
    correctAnswersPercentage: number
    completedAt: Date
    startedAt: Date
  }
  totalQuizAttempts: number
}

interface AcademyManagementProps {
  sessionId: string
  sessionName: string
  sessionQuizzes: Array<{
    id: string
    title: string
    isActive: boolean
  }>
}

export default function AcademyManagement({ sessionId, sessionName, sessionQuizzes }: AcademyManagementProps) {
  const [candidates, setCandidates] = useState<CandidateMonitoring[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [editingMatricule, setEditingMatricule] = useState<string | null>(null)
  const [newMatricule, setNewMatricule] = useState('')
  const [editingStatus, setEditingStatus] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<CandidateStatus>('REGISTERED')
  
  // États pour le modal d'entretien
  const [showInterviewModal, setShowInterviewModal] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateMonitoring | null>(null)
  
  // États pour le modal de rapport d'entretien
  const [showInterviewReportModal, setShowInterviewReportModal] = useState(false)
  const [selectedCandidateForReport, setSelectedCandidateForReport] = useState('')

  // Rafraîchissement automatique plus fréquent pour une meilleure réactivité
  useEffect(() => {
    fetchCandidates()
    
    // Rafraîchissement plus fréquent (2 secondes) pour avoir une mise à jour quasi-instantanée
    const quickInterval = setInterval(fetchCandidates, 2000)
    
    return () => clearInterval(quickInterval)
  }, [sessionId])

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    // Notification simple avec alert pour le moment
    if (type === 'error') {
      alert('Erreur: ' + message)
    } else {
      alert('Succès: ' + message)
    }
  }

  const fetchCandidates = async () => {
    try {
      if (!loading) setRefreshing(true)
      
      const response = await fetch(`/api/admin/monitoring?sessionId=${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setCandidates(data)
      } else {
        showNotification('Erreur lors du chargement des candidats', 'error')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showNotification('Erreur réseau', 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const updateCandidate = async (candidateId: string, updates: { matricule?: string; status?: CandidateStatus }) => {
    try {
      const response = await fetch('/api/admin/candidates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          sessionId,
          ...updates
        })
      })

      if (response.ok) {
        await fetchCandidates()
        showNotification('Candidat mis à jour avec succès')
        setEditingMatricule(null)
        setEditingStatus(null)
      } else {
        showNotification('Erreur lors de la mise à jour', 'error')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showNotification('Erreur réseau', 'error')
    }
  }

  const resetQuiz = async (candidateId: string, quizId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir remettre à zéro toutes les tentatives de quiz pour ce candidat ? Cette action est irréversible.')) return

    try {
      const response = await fetch(`/api/admin/candidates/quiz-reset?candidateId=${candidateId}&quizId=${quizId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const result = await response.json()
        await fetchCandidates()
        showNotification(`Quiz remis à zéro: ${result.message}`)
      } else {
        const error = await response.json()
        showNotification(error.error || 'Erreur lors de la remise à zéro', 'error')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showNotification('Erreur réseau', 'error')
    }
  }

  const removeCandidate = async (candidateId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir désinscrire ce candidat de la session ?')) {
      return
    }

    try {
      const response = await fetch(`/api/sessions/${sessionId}/candidates/${candidateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchCandidates()
        showNotification('Candidat désinscrit avec succès')
      } else {
        showNotification('Erreur lors de la désinscription', 'error')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showNotification('Erreur réseau', 'error')
    }
  }

  const startInterview = (candidateId: string) => {
    const candidate = candidates.find(c => c.candidateId === candidateId)
    if (candidate) {
      setSelectedCandidate(candidate)
      setShowInterviewModal(true)
    }
  }

  const unassignInterview = async (candidateId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir désaffecter cet entretien ?')) {
      return
    }

    try {
      const response = await fetch(`/api/sessions/${sessionId}/candidates/${candidateId}/interview`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchCandidates()
        showNotification('Entretien désaffecté avec succès')
      } else {
        showNotification('Erreur lors de la désaffectation', 'error')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showNotification('Erreur réseau', 'error')
    }
  }

  const viewInterviewReport = (candidateId: string) => {
    setSelectedCandidateForReport(candidateId)
    setShowInterviewReportModal(true)
  }

  const viewQuizAnswers = (candidateId: string) => {
    // Ouvrir les réponses du quiz dans une nouvelle fenêtre ou modal
    window.open(`/admin/quiz-answers/${candidateId}?sessionId=${sessionId}`, '_blank')
  }

  const getStatusBadge = (candidate: CandidateMonitoring) => {
    // Si l'entretien est terminé, utiliser la décision d'entretien
    if (candidate.interviewStatus?.completed && candidate.interviewStatus?.decision) {
      const decisionConfig = {
        FAVORABLE: { 
          background: 'rgba(34, 197, 94, 0.1)', 
          border: 'rgba(34, 197, 94, 0.3)', 
          color: '#22c55e', 
          text: 'Favorable' 
        },
        A_SURVEILLER: { 
          background: 'rgba(251, 146, 60, 0.1)', 
          border: 'rgba(251, 146, 60, 0.3)', 
          color: '#fb923c', 
          text: 'À surveiller' 
        },
        DEFAVORABLE: { 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: 'rgba(239, 68, 68, 0.3)', 
          color: '#ef4444', 
          text: 'Défavorable' 
        }
      }
      
      const config = decisionConfig[candidate.interviewStatus.decision]
      return (
        <span style={{
          padding: '6px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          background: config.background,
          border: `1px solid ${config.border}`,
          color: config.color
        }}>
          {config.text}
        </span>
      )
    }

    // Vérifier si l'entretien est en cours
    if (candidate.interviewStatus?.inProgress) {
      return (
        <span style={{
          padding: '6px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          background: 'rgba(147, 51, 234, 0.1)',
          border: '1px solid rgba(147, 51, 234, 0.3)',
          color: '#9333ea'
        }}>
          En entretien avec {candidate.interviewStatus.interviewer}
        </span>
      )
    }

    // Sinon utiliser le statut général
    const statusConfig = {
      REGISTERED: { 
        background: 'rgba(156, 163, 175, 0.1)', 
        border: 'rgba(156, 163, 175, 0.3)', 
        color: '#9ca3af', 
        text: 'Inscrit' 
      },
      EN_ATTENTE: { 
        background: 'rgba(59, 130, 246, 0.1)', 
        border: 'rgba(59, 130, 246, 0.3)', 
        color: '#3b82f6', 
        text: 'En attente' 
      },
      FAVORABLE: { 
        background: 'rgba(34, 197, 94, 0.1)', 
        border: 'rgba(34, 197, 94, 0.3)', 
        color: '#22c55e', 
        text: 'Favorable' 
      },
      A_SURVEILLER: { 
        background: 'rgba(251, 146, 60, 0.1)', 
        border: 'rgba(251, 146, 60, 0.3)', 
        color: '#fb923c', 
        text: 'À surveiller' 
      },
      DEFAVORABLE: { 
        background: 'rgba(239, 68, 68, 0.1)', 
        border: 'rgba(239, 68, 68, 0.3)', 
        color: '#ef4444', 
        text: 'Défavorable' 
      }
    }
    
    const config = statusConfig[candidate.status]
    return (
      <span style={{
        padding: '6px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        background: config.background,
        border: `1px solid ${config.border}`,
        color: config.color
      }}>
        {config.text}
      </span>
    )
  }

  const getQuizAccessibility = (candidate: CandidateMonitoring) => {
    // Si le candidat n'a pas terminé son entretien
    if (!candidate.interviewStatus?.completed) {
      return { canAccess: false, reason: 'Entretien non terminé' }
    }

    // Si la décision d'entretien est défavorable
    if (candidate.interviewStatus?.decision === 'DEFAVORABLE') {
      return { canAccess: false, reason: 'Entretien défavorable' }
    }

    return { canAccess: true, reason: null }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const generateNextMatricule = () => {
    const existingMatricules = candidates
      .map(c => c.matricule)
      .filter(Boolean)
      .map(m => parseInt(m!))
      .filter(n => !isNaN(n))
    
    const maxMatricule = existingMatricules.length > 0 ? Math.max(...existingMatricules) : 0
    return (maxMatricule + 1).toString().padStart(3, '0')
  }

  const sortedCandidates = [...candidates].sort((a, b) => {
    // D'abord par matricule (ceux qui en ont un en premier)
    if (a.matricule && !b.matricule) return -1
    if (!a.matricule && b.matricule) return 1
    if (a.matricule && b.matricule) {
      return parseInt(a.matricule) - parseInt(b.matricule)
    }
    // Puis par nom
    return a.fullName.localeCompare(b.fullName)
  })

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 20px',
        maxWidth: '1400px',
        margin: '0 auto'
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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            justifyContent: 'center'
          }}>
            <RefreshCw style={{ 
              width: '20px', 
              height: '20px', 
              color: '#3b82f6',
              animation: 'spin 2s linear infinite'
            }} />
            <span style={{
              color: 'white',
              fontSize: '18px',
              fontWeight: '500'
            }}>
              Chargement des données...
            </span>
          </div>
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

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* En-tête avec design moderne */}
      <div style={{
        background: 'rgba(17, 24, 39, 0.8)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '32px',
        marginBottom: '32px',
        border: '1px solid rgba(75, 85, 99, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '0 0 8px 0'
            }}>
              🎯 Gestion Académie
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#9ca3af',
              margin: 0
            }}>
              Session: {sessionName}
            </p>
          </div>
          <button
            onClick={fetchCandidates}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 24px',
              background: refreshing 
                ? 'rgba(59, 130, 246, 0.5)' 
                : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: refreshing 
                ? '0 2px 8px rgba(59, 130, 246, 0.2)' 
                : '0 4px 15px rgba(59, 130, 246, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (!refreshing) {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (!refreshing) {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)'
              }
            }}
          >
            <RefreshCw style={{ 
              width: '18px', 
              height: '18px',
              animation: refreshing ? 'spin 1s linear infinite' : 'none'
            }} />
            {refreshing ? 'Actualisation...' : 'Actualiser'}
          </button>
        </div>
      </div>

      {/* Statistiques avec espacement et style améliorés */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>
        <div style={{
          background: 'rgba(17, 24, 39, 0.7)',
          backdropFilter: 'blur(16px)',
          borderRadius: '16px',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          padding: '24px',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)'
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(59, 130, 246, 0.2)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              padding: '16px',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <Users style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
            </div>
            <div>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>Total candidats</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', margin: 0 }}>
                {candidates.length}
              </p>
            </div>
          </div>
        </div>
        
        <div style={{
          background: 'rgba(17, 24, 39, 0.7)',
          backdropFilter: 'blur(16px)',
          borderRadius: '16px',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          padding: '24px',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.4)'
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(34, 197, 94, 0.2)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.2)'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              padding: '16px',
              background: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(34, 197, 94, 0.2)'
            }}>
              <CheckCircle2 style={{ width: '24px', height: '24px', color: '#22c55e' }} />
            </div>
            <div>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>Entretiens terminés</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', margin: 0 }}>
                {candidates.filter(c => c.interviewStatus?.completed).length}
              </p>
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(17, 24, 39, 0.7)',
          backdropFilter: 'blur(16px)',
          borderRadius: '16px',
          border: '1px solid rgba(251, 146, 60, 0.2)',
          padding: '24px',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.borderColor = 'rgba(251, 146, 60, 0.4)'
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(251, 146, 60, 0.2)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.borderColor = 'rgba(251, 146, 60, 0.2)'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              padding: '16px',
              background: 'rgba(251, 146, 60, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(251, 146, 60, 0.2)'
            }}>
              <Clock style={{ width: '24px', height: '24px', color: '#fb923c' }} />
            </div>
            <div>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>Quiz en cours</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', margin: 0 }}>
                {candidates.filter(c => c.activeQuiz).length}
              </p>
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(17, 24, 39, 0.7)',
          backdropFilter: 'blur(16px)',
          borderRadius: '16px',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          padding: '24px',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)'
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(239, 68, 68, 0.2)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              padding: '16px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <AlertTriangle style={{ width: '24px', height: '24px', color: '#ef4444' }} />
            </div>
            <div>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>À surveiller</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', margin: 0 }}>
                {candidates.filter(c => c.status === 'A_SURVEILLER').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table des candidats avec style moderne */}
      <div style={{
        background: 'rgba(17, 24, 39, 0.8)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid rgba(75, 85, 99, 0.3)',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          padding: '32px 32px 24px 32px',
          borderBottom: '1px solid rgba(75, 85, 99, 0.2)'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: 'white',
            margin: '0 0 8px 0'
          }}>
            📋 Liste des Candidats
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#9ca3af',
            margin: 0
          }}>
            Gestion et suivi en temps réel
          </p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(31, 41, 55, 0.5)' }}>
                <th style={{
                  textAlign: 'left',
                  padding: '16px 24px',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#9ca3af',
                  borderBottom: '1px solid rgba(75, 85, 99, 0.2)'
                }}>Matricule</th>
                <th style={{
                  textAlign: 'left',
                  padding: '16px 24px',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#9ca3af',
                  borderBottom: '1px solid rgba(75, 85, 99, 0.2)'
                }}>Candidat</th>
                <th style={{
                  textAlign: 'left',
                  padding: '16px 24px',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#9ca3af',
                  borderBottom: '1px solid rgba(75, 85, 99, 0.2)'
                }}>Statut</th>
                <th style={{
                  textAlign: 'left',
                  padding: '16px 24px',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#9ca3af',
                  borderBottom: '1px solid rgba(75, 85, 99, 0.2)'
                }}>Entretien</th>
                <th style={{
                  textAlign: 'left',
                  padding: '16px 24px',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#9ca3af',
                  borderBottom: '1px solid rgba(75, 85, 99, 0.2)'
                }}>Quiz en cours</th>
                <th style={{
                  textAlign: 'left',
                  padding: '16px 24px',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#9ca3af',
                  borderBottom: '1px solid rgba(75, 85, 99, 0.2)'
                }}>Dernier quiz</th>
                <th style={{
                  textAlign: 'left',
                  padding: '16px 24px',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#9ca3af',
                  borderBottom: '1px solid rgba(75, 85, 99, 0.2)'
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedCandidates.map((candidate) => {
                const quizAccess = getQuizAccessibility(candidate)
                
                return (
                  <tr 
                    key={candidate.candidateId} 
                    style={{
                      borderBottom: '1px solid rgba(75, 85, 99, 0.2)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    {/* Matricule */}
                    <td style={{ padding: '20px 24px' }}>
                      {editingMatricule === candidate.candidateId ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="text"
                            value={newMatricule}
                            onChange={(e) => setNewMatricule(e.target.value)}
                            style={{
                              width: '80px',
                              padding: '8px 12px',
                              border: '1px solid rgba(75, 85, 99, 0.3)',
                              borderRadius: '8px',
                              background: 'rgba(31, 41, 55, 0.8)',
                              color: 'white',
                              fontSize: '14px',
                              outline: 'none'
                            }}
                            placeholder="001"
                          />
                          <button
                            onClick={() => updateCandidate(candidate.candidateId, { matricule: newMatricule })}
                            style={{
                              padding: '8px 12px',
                              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingMatricule(null)}
                            style={{
                              padding: '8px 12px',
                              background: 'rgba(75, 85, 99, 0.6)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <X style={{ width: '12px', height: '12px' }} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontFamily: 'monospace',
                            color: 'white',
                            background: 'rgba(59, 130, 246, 0.1)',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            border: '1px solid rgba(59, 130, 246, 0.2)'
                          }}>
                            {candidate.matricule || 'Non assigné'}
                          </span>
                          <button
                            onClick={() => {
                              setEditingMatricule(candidate.candidateId)
                              setNewMatricule(candidate.matricule || generateNextMatricule())
                            }}
                            style={{
                              color: '#3b82f6',
                              background: 'transparent',
                              border: 'none',
                              padding: '4px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            ✏️
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Candidat */}
                    <td style={{ padding: '20px 24px' }}>
                      <div>
                        <p style={{ 
                          fontWeight: '600', 
                          color: 'white', 
                          margin: '0 0 4px 0',
                          fontSize: '14px'
                        }}>
                          {candidate.fullName}
                        </p>
                        <p style={{ 
                          fontSize: '12px', 
                          color: '#9ca3af',
                          margin: 0
                        }}>
                          {candidate.username}
                        </p>
                      </div>
                    </td>

                    {/* Statut */}
                    <td style={{ padding: '20px 24px' }}>
                      {editingStatus === candidate.candidateId ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value as CandidateStatus)}
                            style={{
                              padding: '8px 12px',
                              border: '1px solid rgba(75, 85, 99, 0.3)',
                              borderRadius: '8px',
                              fontSize: '12px',
                              background: 'rgba(31, 41, 55, 0.8)',
                              color: 'white',
                              outline: 'none'
                            }}
                          >
                            <option value="REGISTERED">Inscrit</option>
                            <option value="EN_ATTENTE">En attente</option>
                            <option value="FAVORABLE">Favorable</option>
                            <option value="A_SURVEILLER">À surveiller</option>
                            <option value="DEFAVORABLE">Défavorable</option>
                          </select>
                          <button
                            onClick={() => updateCandidate(candidate.candidateId, { status: newStatus })}
                            style={{
                              padding: '6px 10px',
                              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingStatus(null)}
                            style={{
                              padding: '6px 10px',
                              background: 'rgba(75, 85, 99, 0.6)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            <X style={{ width: '12px', height: '12px' }} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {getStatusBadge(candidate)}
                          <button
                            onClick={() => {
                              setEditingStatus(candidate.candidateId)
                              setNewStatus(candidate.status)
                            }}
                            style={{
                              color: '#3b82f6',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            ✏️
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Entretien */}
                    <td style={{ padding: '20px 24px' }}>
                      {candidate.interviewStatus?.completed ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '200px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle2 style={{ width: '16px', height: '16px', color: '#22c55e' }} />
                            <span style={{ fontSize: '14px', color: 'white' }}>
                              {candidate.interviewStatus.decision === 'FAVORABLE' && 'Favorable'}
                              {candidate.interviewStatus.decision === 'A_SURVEILLER' && 'À surveiller'}
                              {candidate.interviewStatus.decision === 'DEFAVORABLE' && 'Défavorable'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => viewInterviewReport(candidate.candidateId)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 10px',
                                fontSize: '11px',
                                background: 'rgba(59, 130, 246, 0.1)',
                                color: '#3b82f6',
                                borderRadius: '6px',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'
                              }}
                            >
                              📋 Compte-rendu
                            </button>
                            {candidate.lastQuizAttempt && (
                              <button
                                onClick={() => viewQuizAnswers(candidate.candidateId)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '6px 10px',
                                  fontSize: '11px',
                                  background: 'rgba(139, 92, 246, 0.1)',
                                  color: '#8b5cf6',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(139, 92, 246, 0.2)',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'
                                }}
                              >
                                🧠 Quiz
                              </button>
                            )}
                          </div>
                        </div>
                      ) : candidate.interviewStatus?.inProgress ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '12px',
                              height: '12px',
                              background: '#f59e0b',
                              borderRadius: '50%',
                              animation: 'pulse 1.5s infinite'
                            }}></div>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '500',
                              background: 'rgba(251, 146, 60, 0.1)',
                              color: '#fb923c',
                              border: '1px solid rgba(251, 146, 60, 0.2)'
                            }}>
                              En cours
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                            Avec: {candidate.interviewStatus.interviewer}
                          </div>
                          <button
                            onClick={() => unassignInterview(candidate.candidateId)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              fontSize: '10px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444',
                              borderRadius: '6px',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                            }}
                          >
                            <UserX style={{ width: '8px', height: '8px' }} />
                            Désaffecter
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: '#3b82f6',
                            border: '1px solid rgba(59, 130, 246, 0.2)'
                          }}>
                            En attente
                          </span>
                          <button
                            onClick={() => startInterview(candidate.candidateId)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 10px',
                              fontSize: '11px',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)'
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0) scale(1)'
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            <Play style={{ width: '10px', height: '10px' }} />
                            Lancer
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Quiz en cours */}
                    <td style={{ padding: '20px 24px' }}>
                      {candidate.activeQuiz ? (
                        <div style={{ maxWidth: '200px' }}>
                          <p style={{ fontSize: '14px', fontWeight: '600', color: 'white', margin: '0 0 4px 0' }}>
                            {candidate.activeQuiz.quizTitle}
                          </p>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px', 
                            fontSize: '12px', 
                            color: '#fb923c',
                            marginBottom: '4px'
                          }}>
                            <Clock style={{ width: '12px', height: '12px' }} />
                            <span>Débuté à: {new Date(candidate.activeQuiz.startedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                            Score: {candidate.activeQuiz.currentScore} | 
                            Questions: {candidate.activeQuiz.questionsAnswered}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#6b7280' }}>-</span>
                      )}
                    </td>

                    {/* Dernier quiz */}
                    <td style={{ padding: '20px 24px' }}>
                      {candidate.lastQuizAttempt ? (
                        <div style={{ maxWidth: '180px' }}>
                          <p style={{ fontSize: '14px', color: 'white', margin: '0 0 4px 0' }}>
                            {candidate.lastQuizAttempt.quizTitle}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {candidate.lastQuizAttempt.completed ? (
                              <CheckCircle2 style={{ width: '16px', height: '16px', color: '#22c55e' }} />
                            ) : (
                              <Clock style={{ width: '16px', height: '16px', color: '#fb923c' }} />
                            )}
                            <span style={{ fontSize: '14px', color: 'white' }}>
                              {candidate.lastQuizAttempt.correctAnswersPercentage}% de bonnes réponses
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#6b7280' }}>Aucun</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {candidate.lastQuizAttempt && sessionQuizzes.length > 0 && (
                          <button
                            onClick={() => resetQuiz(candidate.candidateId, sessionQuizzes[0].id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '8px 12px',
                              fontSize: '12px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444',
                              borderRadius: '8px',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                            }}
                          >
                            <RotateCcw style={{ width: '12px', height: '12px' }} />
                            Reset
                          </button>
                        )}
                        
                        <button
                          onClick={() => removeCandidate(candidate.candidateId)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '8px 12px',
                            fontSize: '12px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#dc2626',
                            borderRadius: '8px',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'
                            e.currentTarget.style.transform = 'translateY(-1px)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
                            e.currentTarget.style.transform = 'translateY(0)'
                          }}
                        >
                          <X style={{ width: '12px', height: '12px' }} />
                          Désinscrire
                        </button>
                        
                        {!quizAccess.canAccess && (
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            background: 'rgba(156, 163, 175, 0.1)',
                            color: '#9ca3af',
                            border: '1px solid rgba(156, 163, 175, 0.2)'
                          }}>
                            {quizAccess.reason}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'entretien */}
      {selectedCandidate && (
        <InterviewModal
          isOpen={showInterviewModal}
          onClose={() => {
            setShowInterviewModal(false)
            setSelectedCandidate(null)
          }}
          candidateId={selectedCandidate.candidateId}
          candidateName={selectedCandidate.fullName}
          sessionId={sessionId}
          onComplete={() => {
            fetchCandidates()
          }}
        />
      )}

      <style>
        {`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}
      </style>

      {/* Modal de rapport d'entretien */}
      <InterviewReportModal
        isOpen={showInterviewReportModal}
        onClose={() => setShowInterviewReportModal(false)}
        candidateId={selectedCandidateForReport}
        sessionId={sessionId}
      />
    </div>
  )
}
