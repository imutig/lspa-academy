'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Users, Clock, CheckCircle2, AlertTriangle, X, RotateCcw } from 'lucide-react'

type CandidateStatus = 'REGISTERED' | 'EN_ATTENTE' | 'FAVORABLE' | 'A_SURVEILLER' | 'DEFAVORABLE'
type InterviewDecision = 'FAVORABLE' | 'DEFAVORABLE' | 'A_SURVEILLER'

interface CandidateMonitoring {
  candidateId: string
  matricule: string | null
  fullName: string
  username: string
  status: CandidateStatus
  interviewCompleted: boolean
  interviewDecision?: InterviewDecision
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
  const [editingMatricule, setEditingMatricule] = useState<string | null>(null)
  const [newMatricule, setNewMatricule] = useState('')
  const [editingStatus, setEditingStatus] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<CandidateStatus>('REGISTERED')

  // Rafraîchissement automatique toutes les 10 secondes
  useEffect(() => {
    fetchCandidates()
    const interval = setInterval(fetchCandidates, 10000)
    return () => clearInterval(interval)
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
    if (!confirm('Êtes-vous sûr de vouloir remettre à zéro ce quiz ?')) return

    try {
      const response = await fetch(`/api/admin/candidates?candidateId=${candidateId}&quizId=${quizId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchCandidates()
        showNotification('Quiz remis à zéro avec succès')
      } else {
        showNotification('Erreur lors de la remise à zéro', 'error')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showNotification('Erreur réseau', 'error')
    }
  }

  const getStatusBadge = (status: CandidateStatus) => {
    const statusConfig = {
      REGISTERED: { color: 'bg-gray-100 text-gray-800', text: 'Inscrit' },
      EN_ATTENTE: { color: 'bg-blue-100 text-blue-800', text: 'En attente' },
      FAVORABLE: { color: 'bg-green-100 text-green-800', text: 'Favorable' },
      A_SURVEILLER: { color: 'bg-orange-100 text-orange-800', text: 'À surveiller' },
      DEFAVORABLE: { color: 'bg-red-100 text-red-800', text: 'Défavorable' }
    }
    
    const config = statusConfig[status]
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const getQuizAccessibility = (candidate: CandidateMonitoring) => {
    // Si le candidat n'a pas terminé son entretien
    if (!candidate.interviewCompleted) {
      return { canAccess: false, reason: 'Entretien non terminé' }
    }

    // Si la décision d'entretien est défavorable
    if (candidate.interviewDecision === 'DEFAVORABLE') {
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
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement...</span>
      </div>
    )
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion Académie</h1>
          <p className="text-gray-600">Session: {sessionName}</p>
        </div>
        <button
          onClick={fetchCandidates}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total candidats</p>
              <p className="text-2xl font-bold text-gray-900">{candidates.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Entretiens terminés</p>
              <p className="text-2xl font-bold text-gray-900">
                {candidates.filter(c => c.interviewCompleted).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Quiz en cours</p>
              <p className="text-2xl font-bold text-gray-900">
                {candidates.filter(c => c.activeQuiz).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">À surveiller</p>
              <p className="text-2xl font-bold text-gray-900">
                {candidates.filter(c => c.status === 'A_SURVEILLER').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table des candidats */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Candidats</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-900">Matricule</th>
                <th className="text-left p-4 font-medium text-gray-900">Candidat</th>
                <th className="text-left p-4 font-medium text-gray-900">Statut</th>
                <th className="text-left p-4 font-medium text-gray-900">Entretien</th>
                <th className="text-left p-4 font-medium text-gray-900">Quiz en cours</th>
                <th className="text-left p-4 font-medium text-gray-900">Dernier quiz</th>
                <th className="text-left p-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedCandidates.map((candidate) => {
                const quizAccess = getQuizAccessibility(candidate)
                
                return (
                  <tr key={candidate.candidateId} className="border-b hover:bg-gray-50">
                    {/* Matricule */}
                    <td className="p-4">
                      {editingMatricule === candidate.candidateId ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={newMatricule}
                            onChange={(e) => setNewMatricule(e.target.value)}
                            className="w-20 px-2 py-1 border rounded"
                            placeholder="001"
                          />
                          <button
                            onClick={() => updateCandidate(candidate.candidateId, { matricule: newMatricule })}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingMatricule(null)}
                            className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="font-mono">
                            {candidate.matricule || 'Non assigné'}
                          </span>
                          <button
                            onClick={() => {
                              setEditingMatricule(candidate.candidateId)
                              setNewMatricule(candidate.matricule || generateNextMatricule())
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ✏️
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Candidat */}
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-gray-900">{candidate.fullName}</p>
                        <p className="text-sm text-gray-500">{candidate.username}</p>
                      </div>
                    </td>

                    {/* Statut */}
                    <td className="p-4">
                      {editingStatus === candidate.candidateId ? (
                        <div className="flex items-center space-x-2">
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value as CandidateStatus)}
                            className="px-2 py-1 border rounded text-sm"
                          >
                            <option value="REGISTERED">Inscrit</option>
                            <option value="EN_ATTENTE">En attente</option>
                            <option value="FAVORABLE">Favorable</option>
                            <option value="A_SURVEILLER">À surveiller</option>
                            <option value="DEFAVORABLE">Défavorable</option>
                          </select>
                          <button
                            onClick={() => updateCandidate(candidate.candidateId, { status: newStatus })}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingStatus(null)}
                            className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(candidate.status)}
                          <button
                            onClick={() => {
                              setEditingStatus(candidate.candidateId)
                              setNewStatus(candidate.status)
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ✏️
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Entretien */}
                    <td className="p-4">
                      {candidate.interviewCompleted ? (
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">
                            {candidate.interviewDecision === 'FAVORABLE' && 'Favorable'}
                            {candidate.interviewDecision === 'A_SURVEILLER' && 'À surveiller'}
                            {candidate.interviewDecision === 'DEFAVORABLE' && 'Défavorable'}
                          </span>
                        </div>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          En attente
                        </span>
                      )}
                    </td>

                    {/* Quiz en cours */}
                    <td className="p-4">
                      {candidate.activeQuiz ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{candidate.activeQuiz.quizTitle}</p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>Temps restant: {formatTime(candidate.activeQuiz.timeRemaining)}</span>
                          </div>
                          <div className="text-xs text-gray-600">
                            Score: {candidate.activeQuiz.currentScore} | 
                            Questions: {candidate.activeQuiz.questionsAnswered}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Dernier quiz */}
                    <td className="p-4">
                      {candidate.lastQuizAttempt ? (
                        <div className="space-y-1">
                          <p className="text-sm">{candidate.lastQuizAttempt.quizTitle}</p>
                          <div className="flex items-center space-x-2">
                            {candidate.lastQuizAttempt.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-orange-600" />
                            )}
                            <span className="text-sm">
                              Score: {candidate.lastQuizAttempt.score}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Aucun</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        {candidate.lastQuizAttempt && sessionQuizzes.length > 0 && (
                          <button
                            onClick={() => resetQuiz(candidate.candidateId, sessionQuizzes[0].id)}
                            className="flex items-center px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reset
                          </button>
                        )}
                        
                        {!quizAccess.canAccess && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
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
    </div>
  )
}
