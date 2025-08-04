'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
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

export default function SessionDetailsTestPage() {
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
        <p className="text-white text-xl">Redirection...</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="p-6">
          <div className="flex items-center justify-center pt-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-300 text-xl">Chargement des détails...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="p-6">
          <div className="max-w-4xl mx-auto pt-20">
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 text-red-300 backdrop-blur-sm">
              <h2 className="text-xl font-bold mb-2">Erreur</h2>
              <p>{error}</p>
            </div>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ← Retour
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="p-6">
          <div className="max-w-4xl mx-auto pt-20">
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 text-yellow-300 backdrop-blur-sm">
              <h2 className="text-xl font-bold mb-2">Session non trouvée</h2>
              <p>Impossible de trouver les détails de cette session.</p>
            </div>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ← Retour
            </button>
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
    <div className="min-h-screen bg-gray-900">
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="mb-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Retour aux sessions
          </button>
          <h1 className="text-3xl font-bold text-white">Session Test (Sans Navbar)</h1>
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
