'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Interview {
  id: string
  candidateId: string
  interviewerId: string
  scheduledAt: string
  type: string
  status: string
  notes: string
  decision?: string
  score?: number
  completedAt?: string
  candidate: {
    id: string
    username: string
    email: string
  }
  interviewer: {
    id: string
    username: string
    email: string
  }
}

interface User {
  id: string
  username: string
  email: string
  role: string
}

export default function InterviewManager() {
  const { data: session } = useSession()
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [candidates, setCandidates] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null)

  const [newInterview, setNewInterview] = useState({
    candidateId: '',
    scheduledAt: '',
    type: 'ORAL',
    notes: ''
  })

  const statusColors = {
    SCHEDULED: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    IN_PROGRESS: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    COMPLETED: 'bg-green-500/20 text-green-300 border-green-500/30',
    CANCELLED: 'bg-red-500/20 text-red-300 border-red-500/30'
  }

  const decisionColors = {
    ACCEPTED: 'bg-green-500/20 text-green-300',
    REJECTED: 'bg-red-500/20 text-red-300',
    PENDING: 'bg-yellow-500/20 text-yellow-300'
  }

  useEffect(() => {
    fetchInterviews()
    if (session?.user.role !== 'CANDIDAT') {
      fetchCandidates()
    }
  }, [session])

  const fetchInterviews = async () => {
    try {
      const response = await fetch('/api/interviews')
      if (response.ok) {
        const data = await response.json()
        setInterviews(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des interviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCandidates = async () => {
    try {
      const response = await fetch('/api/users?role=CANDIDAT')
      if (response.ok) {
        const data = await response.json()
        setCandidates(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des candidats:', error)
    }
  }

  const handleCreateInterview = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInterview)
      })

      if (response.ok) {
        fetchInterviews()
        setShowCreateForm(false)
        setNewInterview({ candidateId: '', scheduledAt: '', type: 'ORAL', notes: '' })
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'interview:', error)
    }
  }

  const handleUpdateInterview = async (interview: Interview, updates: any) => {
    try {
      const response = await fetch('/api/interviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: interview.id, ...updates })
      })

      if (response.ok) {
        fetchInterviews()
        setEditingInterview(null)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'interview:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestion des Interviews</h1>
          <p className="text-gray-400">
            {session?.user.role === 'CANDIDAT' ? 
              'Consultez vos interviews programmées' : 
              'Planifiez et gérez les interviews des candidats'
            }
          </p>
        </div>

        {session?.user.role !== 'CANDIDAT' && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Programmer Interview</span>
          </button>
        )}
      </div>

      {/* Formulaire de création */}
      {showCreateForm && (
        <div className="glass rounded-2xl p-6 animate-slide-down">
          <h3 className="text-xl font-bold text-white mb-4">Programmer une Interview</h3>
          <form onSubmit={handleCreateInterview} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Candidat
                </label>
                <select
                  value={newInterview.candidateId}
                  onChange={(e) => setNewInterview({...newInterview, candidateId: e.target.value})}
                  className="w-full bg-dark-200 border border-dark-400 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="">Sélectionner un candidat</option>
                  {candidates.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.username} ({candidate.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date et heure
                </label>
                <input
                  type="datetime-local"
                  value={newInterview.scheduledAt}
                  onChange={(e) => setNewInterview({...newInterview, scheduledAt: e.target.value})}
                  className="w-full bg-dark-200 border border-dark-400 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type d'interview
                </label>
                <select
                  value={newInterview.type}
                  onChange={(e) => setNewInterview({...newInterview, type: e.target.value})}
                  className="w-full bg-dark-200 border border-dark-400 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="ORAL">Entretien Oral</option>
                  <option value="PRACTICAL">Test Pratique</option>
                  <option value="WRITTEN">Examen Écrit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={newInterview.notes}
                  onChange={(e) => setNewInterview({...newInterview, notes: e.target.value})}
                  className="w-full bg-dark-200 border border-dark-400 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  rows={3}
                  placeholder="Instructions ou notes particulières..."
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button type="submit" className="btn-primary">
                Programmer
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des interviews */}
      <div className="space-y-4">
        {interviews.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-400 text-2xl">📅</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Aucune interview</h3>
            <p className="text-gray-400">
              {session?.user.role === 'CANDIDAT' ? 
                'Aucune interview n\'est programmée pour le moment.' :
                'Commencez par programmer une interview pour un candidat.'
              }
            </p>
          </div>
        ) : (
          interviews.map((interview) => (
            <div key={interview.id} className="glass rounded-2xl p-6 hover-glow transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-bold text-white">
                      Interview - {interview.candidate.username}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[interview.status as keyof typeof statusColors]}`}>
                      {interview.status}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-400">
                    <p>📅 Programmée le: {formatDate(interview.scheduledAt)}</p>
                    <p>👤 Candidat: {interview.candidate.email}</p>
                    <p>🎯 Type: {interview.type}</p>
                    {session?.user.role !== 'CANDIDAT' && (
                      <p>👨‍💼 Examinateur: {interview.interviewer.username}</p>
                    )}
                  </div>

                  {interview.notes && (
                    <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <p className="text-sm text-blue-200">{interview.notes}</p>
                    </div>
                  )}

                  {interview.decision && (
                    <div className="mt-3 flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${decisionColors[interview.decision as keyof typeof decisionColors]}`}>
                        {interview.decision}
                      </span>
                      {interview.score && (
                        <span className="text-sm text-gray-400">
                          Score: {interview.score}/100
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {session?.user.role !== 'CANDIDAT' && interview.status !== 'CANCELLED' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingInterview(interview)}
                      className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                    >
                      Modifier
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal d'édition */}
      {editingInterview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Modifier l'Interview</h3>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              handleUpdateInterview(editingInterview, {
                status: formData.get('status'),
                notes: formData.get('notes'),
                decision: formData.get('decision'),
                score: formData.get('score')
              })
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Statut
                  </label>
                  <select
                    name="status"
                    defaultValue={editingInterview.status}
                    className="w-full bg-dark-200 border border-dark-400 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="SCHEDULED">Programmée</option>
                    <option value="IN_PROGRESS">En cours</option>
                    <option value="COMPLETED">Terminée</option>
                    <option value="CANCELLED">Annulée</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Décision
                  </label>
                  <select
                    name="decision"
                    defaultValue={editingInterview.decision || ''}
                    className="w-full bg-dark-200 border border-dark-400 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Aucune décision</option>
                    <option value="PENDING">En attente</option>
                    <option value="ACCEPTED">Accepté</option>
                    <option value="REJECTED">Refusé</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Score (0-100)
                  </label>
                  <input
                    type="number"
                    name="score"
                    min="0"
                    max="100"
                    defaultValue={editingInterview.score || ''}
                    className="w-full bg-dark-200 border border-dark-400 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    defaultValue={editingInterview.notes}
                    className="w-full bg-dark-200 border border-dark-400 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button type="submit" className="btn-primary">
                  Sauvegarder
                </button>
                <button
                  type="button"
                  onClick={() => setEditingInterview(null)}
                  className="btn-secondary"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
