'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { modernDesign, createHoverEffect } from '../utils/modernDesign'
import '../styles/quiz-buttons.css'

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: string
  points: number
  order: number
}

interface Quiz {
  id: string
  title: string
  description: string
  timeLimit?: number
  passingScoreNormal: number
  passingScoreToWatch: number
  questions: Question[]
  attempts?: any[]
  sessionName?: string
  sessionId?: string
  hasAttempt?: boolean
  attemptScore?: number
  attemptPassed?: boolean
  _count?: {
    questions: number
    attempts: number
  }
}

interface QuizAttempt {
  id: string
  score: number
  passed: boolean
  timeSpent?: number
  completedAt: string
  quiz: {
    title: string
    passingScoreNormal: number
    passingScoreToWatch: number
  }
  session?: {
    name: string
  }
}

export default function QuizManager() {
  const { data: session } = useSession()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<{[key: string]: string}>({})
  const [currentScore, setCurrentScore] = useState({ correct: 0, total: 0, percentage: 0, totalQuestions: 0 })
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(() => {
    // Persistance de l'état du formulaire de création dans sessionStorage
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('quiz-create-form-open') === 'true'
    }
    return false
  })
  const [isLoaded, setIsLoaded] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [quizProgress, setQuizProgress] = useState<{[key: string]: any}>({})
  const [isResuming, setIsResuming] = useState(false)
  const [interviewStatus, setInterviewStatus] = useState<{
    canAccessQuizzes: boolean
    interviewStatus: string
    message: string | null
  }>({
    canAccessQuizzes: false,
    interviewStatus: 'NONE',
    message: null
  })

  const [newQuiz, setNewQuiz] = useState(() => {
    // Charger les données sauvegardées depuis sessionStorage
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('quiz-create-form-data')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Erreur lors du chargement des données du formulaire:', e)
        }
      }
    }
    return {
      title: '',
      description: '',
      timeLimit: '',
      passingScoreNormal: '80',
      passingScoreToWatch: '90',
      questions: [{ question: '', options: ['', '', '', ''], correctAnswer: '0', points: '1' }]
    }
  })

  useEffect(() => {
    console.log('📊 currentScore state changed:', currentScore)
  }, [currentScore])

  // Helper pour gérer la persistance de l'état du formulaire de création
  const setShowCreateFormPersistent = (show: boolean) => {
    setShowCreateForm(show)
    if (typeof window !== 'undefined') {
      if (show) {
        sessionStorage.setItem('quiz-create-form-open', 'true')
      } else {
        sessionStorage.removeItem('quiz-create-form-open')
        sessionStorage.removeItem('quiz-create-form-data') // Nettoyer les données aussi
      }
    }
  }

  // Helper pour sauvegarder automatiquement les données du formulaire
  const setNewQuizPersistent = (quiz: any) => {
    setNewQuiz(quiz)
    if (typeof window !== 'undefined' && showCreateForm) {
      sessionStorage.setItem('quiz-create-form-data', JSON.stringify(quiz))
    }
  }

  // Sauvegarder automatiquement quand newQuiz change et que le formulaire est ouvert
  useEffect(() => {
    if (typeof window !== 'undefined' && showCreateForm && (newQuiz.title || newQuiz.description)) {
      sessionStorage.setItem('quiz-create-form-data', JSON.stringify(newQuiz))
    }
  }, [newQuiz, showCreateForm])

  useEffect(() => {
    // Vérifier le statut de l'entretien pour les candidats
    if (session?.user.role === 'CANDIDAT') {
      checkInterviewStatus()
    }
    
    fetchQuizzes()
    if (session?.user.role === 'CANDIDAT') {
      fetchAttempts()
      loadQuizProgress()
    }
    setTimeout(() => setIsLoaded(true), 100)
  }, [session])

  const checkInterviewStatus = async () => {
    try {
      const response = await fetch('/api/candidate/interview-status')
      if (response.ok) {
        const statusData = await response.json()
        setInterviewStatus(statusData)
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du statut d\'entretien:', error)
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timeLeft && timeLeft > 0 && activeQuiz && !showResults) {
      interval = setTimeout(() => {
        const newTimeLeft = timeLeft - 1
        setTimeLeft(newTimeLeft)
        // Sauvegarder le progrès toutes les 10 secondes
        if (newTimeLeft % 10 === 0) {
          saveQuizProgress()
        }
      }, 1000)
    } else if (timeLeft === 0) {
      handleSubmitQuiz()
    }
    return () => clearTimeout(interval)
  }, [timeLeft, activeQuiz, showResults])

  // Sauvegarder le progrès avant de quitter la page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeQuiz && !showResults && session?.user.role === 'CANDIDAT') {
        // Sauvegarder le progrès de manière synchrone
        navigator.sendBeacon('/api/quiz/progress', JSON.stringify({
          quizId: activeQuiz.id,
          currentQuestionIndex,
          answers,
          timeLeft,
          startTime: quizStartTime
        }))
        
        e.preventDefault()
        e.returnValue = 'Votre progrès sera sauvegardé. Voulez-vous vraiment quitter ?'
        return e.returnValue
      }
    }

    const handleUnload = () => {
      if (activeQuiz && !showResults && session?.user.role === 'CANDIDAT') {
        // Sauvegarder le progrès de manière synchrone avant fermeture
        navigator.sendBeacon('/api/quiz/progress', JSON.stringify({
          quizId: activeQuiz.id,
          currentQuestionIndex,
          answers,
          timeLeft,
          startTime: quizStartTime
        }))
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('unload', handleUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('unload', handleUnload)
    }
  }, [activeQuiz, showResults, session, currentQuestionIndex, answers, timeLeft, quizStartTime])

  const fetchQuizzes = async () => {
    try {
      let endpoint = '/api/quiz'
      if (session?.user.role === 'CANDIDAT') {
        endpoint = '/api/candidate/quizzes'
      }
      
      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        setQuizzes(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des quiz:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAttempts = async () => {
    try {
      const response = await fetch('/api/quiz/submit')
      if (response.ok) {
        const data = await response.json()
        setAttempts(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tentatives:', error)
    }
  }

  const loadQuizProgress = async () => {
    if (!session?.user || session.user.role !== 'CANDIDAT') return
    
    try {
      const response = await fetch('/api/quiz/progress')
      if (response.ok) {
        const data = await response.json()
        // Charger les progrès depuis le serveur pour tous les quiz
        // Cette fonction sera appelée lors du montage du composant
      }
    } catch (error) {
      console.error('Erreur lors du chargement des progrès:', error)
    }
  }

  const saveQuizProgress = async () => {
    if (!activeQuiz || !session?.user || session.user.role !== 'CANDIDAT') return
    
    try {
      await fetch('/api/quiz/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: activeQuiz.id,
          currentQuestionIndex,
          answers,
          timeLeft,
          startTime: quizStartTime
        })
      })
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du progrès:', error)
    }
  }

  const checkQuizProgress = async (quizId: string) => {
    if (!session?.user || session.user.role !== 'CANDIDAT') return null
    
    try {
      const response = await fetch(`/api/quiz/progress?quizId=${quizId}`)
      if (response.ok) {
        const data = await response.json()
        return data.hasProgress ? data : null
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du progrès:', error)
    }
    return null
  }

  const startQuiz = async (quiz: Quiz, forceRestart = false) => {
    // Vérifier si le candidat a déjà complété ce quiz
    if (session?.user.role === 'CANDIDAT' && quiz.hasAttempt) {
      alert('Vous avez déjà passé ce quiz. Il n\'est pas possible de le recommencer.')
      return
    }

    // Vérifier s'il y a un progrès existant (sauf si restart forcé)
    if (!forceRestart && session?.user.role === 'CANDIDAT') {
      const progress = await checkQuizProgress(quiz.id)
      if (progress) {
        // Demander si l'utilisateur veut continuer ou recommencer
        const continueQuiz = confirm(
          `Vous avez un quiz en cours. Voulez-vous continuer où vous vous êtes arrêté ?\n\n` +
          `Question: ${progress.currentQuestionIndex + 1}\n` +
          `Temps restant: ${Math.floor(progress.timeLeft / 60)}:${(progress.timeLeft % 60).toString().padStart(2, '0')}\n\n` +
          `Cliquez "OK" pour continuer ou "Annuler" pour recommencer.`
        )
        
        if (continueQuiz) {
          return resumeQuiz(quiz, progress)
        } else {
          // Supprimer le progrès existant
          await fetch(`/api/quiz/progress?quizId=${quiz.id}`, { method: 'DELETE' })
        }
      }
    }

    // Démarrage normal du quiz (nouveau ou restart)
    // Optimisation : si le quiz a déjà les questions chargées, les utiliser directement
    if (quiz.questions && Array.isArray(quiz.questions) && quiz.questions.length > 0) {
      // Vérifier si les questions ont des options valides
      const questionsWithValidOptions = quiz.questions.every(q => 
        q.options && Array.isArray(q.options) && q.options.length > 0
      )
      
      if (questionsWithValidOptions) {
        console.log('Using cached quiz data for faster preview')
        setActiveQuiz(quiz)
        setCurrentQuestionIndex(0)
        setAnswers({})
        setCurrentScore({ correct: 0, total: 0, percentage: 0, totalQuestions: quiz.questions.length })
        setQuizStartTime(Date.now())
        if (quiz.timeLimit) {
          setTimeLeft(quiz.timeLimit * 60)
        }
        setShowResults(false)
        setIsResuming(false)
        return
      }
    }

    // Fallback : charger les questions depuis l'API
    try {
      const response = await fetch(`/api/quiz?id=${quiz.id}&includeQuestions=true`)
      if (response.ok) {
        const fullQuiz = await response.json()
        
        // Debug logging to understand the data structure
        console.log('Quiz data received from API:', fullQuiz)
        console.log('Questions:', fullQuiz.questions)
        
        // Validate that we have proper quiz data
        if (!fullQuiz.questions || !Array.isArray(fullQuiz.questions) || fullQuiz.questions.length === 0) {
          console.error('Quiz questions are missing or invalid:', fullQuiz.questions)
          alert('Erreur: Ce quiz ne contient pas de questions valides.')
          return
        }
        
        // Validate that questions have options
        const invalidQuestions = fullQuiz.questions.filter((q: Question) => !q.options || !Array.isArray(q.options))
        if (invalidQuestions.length > 0) {
          console.error('Some questions have invalid options:', invalidQuestions)
          alert('Erreur: Certaines questions du quiz sont mal formatées.')
          return
        }
        
        setActiveQuiz(fullQuiz)
        setCurrentQuestionIndex(0)
        setAnswers({})
        setCurrentScore({ correct: 0, total: 0, percentage: 0, totalQuestions: fullQuiz.questions.length })
        setQuizStartTime(Date.now())
        if (fullQuiz.timeLimit) {
          setTimeLeft(fullQuiz.timeLimit * 60) // Convert minutes to seconds
        }
        setShowResults(false)
        setIsResuming(false)
      } else {
        console.error('Failed to fetch quiz:', response.status, response.statusText)
        alert('Erreur lors du chargement du quiz.')
      }
    } catch (error) {
      console.error('Erreur lors du démarrage du quiz:', error)
      alert('Erreur lors du démarrage du quiz.')
    }
  }

  const resumeQuiz = async (quiz: Quiz, progress: any) => {
    setIsResuming(true)
    
    try {
      const response = await fetch(`/api/quiz?id=${quiz.id}&includeQuestions=true`)
      if (response.ok) {
        const fullQuiz = await response.json()
        
        setActiveQuiz(fullQuiz)
        setCurrentQuestionIndex(progress.currentQuestionIndex)
        setAnswers(progress.answers)
        setQuizStartTime(progress.startTime)
        setTimeLeft(progress.timeLeft)
        setShowResults(false)
        setIsResuming(false)
        
        // Calculer le score après avoir mis à jour activeQuiz
        setTimeout(() => {
          const resumeScore = calculateScoreWithAnswers(progress.answers)
          setCurrentScore(resumeScore)
        }, 100)
      }
    } catch (error) {
      console.error('Erreur lors de la reprise du quiz:', error)
      alert('Erreur lors de la reprise du quiz.')
      setIsResuming(false)
    }
  }

  // Calculer le score avec des réponses spécifiques (pour éviter les problèmes de state async)
  const calculateScoreWithAnswers = (answersToUse: {[key: string]: string}) => {
    if (!activeQuiz || !activeQuiz.questions) {
      return { correct: 0, total: 0, percentage: 0, totalQuestions: 0 }
    }
    
    let correctAnswers = 0
    let totalAnswered = 0
    
    activeQuiz.questions.forEach((question, questionIndex) => {
      const userAnswerIndex = answersToUse[question.id]
      
      if (userAnswerIndex !== undefined && userAnswerIndex !== null) {
        totalAnswered++
        
        // Utiliser la même logique que le backend
        const userAnswerIndexNum = typeof userAnswerIndex === 'string' ? parseInt(userAnswerIndex, 10) : userAnswerIndex
        
        if (!isNaN(userAnswerIndexNum) && question.options && question.options[userAnswerIndexNum]) {
          // L'API retourne les options comme un tableau de strings
          const userAnswerText = question.options[userAnswerIndexNum]
          const isCorrect = userAnswerText === question.correctAnswer
          
          if (isCorrect) {
            correctAnswers++
          }
        }
      }
    })
    
    const percentage = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0
    
    return { 
      correct: correctAnswers, 
      total: totalAnswered, 
      totalQuestions: activeQuiz.questions.length,
      percentage 
    }
  }

  const handleAnswer = (questionId: string, answer: string) => {
    console.log('🎯 Answer selected:', { questionId, answer })
    
    const newAnswers = { ...answers, [questionId]: answer }
    setAnswers(newAnswers)
    
    // Calculer le score immédiatement avec les nouvelles réponses
    if (activeQuiz?.questions) {
      const immediateScore = calculateScoreWithAnswers(newAnswers)
      console.log('🏆 Score calculated:', `${immediateScore.correct}/${immediateScore.total} (${immediateScore.percentage}%)`)
      console.log('🎯 Before setCurrentScore:', currentScore)
      setCurrentScore(immediateScore) // Mettre à jour l'état du score
      console.log('� After setCurrentScore called with:', immediateScore)
    }
    
    // Sauvegarder immédiatement quand une réponse est donnée
    if (session?.user.role === 'CANDIDAT') {
      setTimeout(() => saveQuizProgress(), 500) // Petit délai pour éviter trop d'appels
    }
  }

  const handleSubmitQuiz = async () => {
    if (!activeQuiz || !quizStartTime) return

    // Si c'est un admin en prévisualisation, juste afficher un résumé
    if (session?.user.role !== 'CANDIDAT') {
      const mockResults = {
        summary: {
          totalQuestions: activeQuiz.questions.length,
          correctAnswers: Object.keys(answers).length, // Juste pour demo
          score: 0,
          maxScore: activeQuiz.questions.length,
          passed: false
        },
        passed: false,
        score: 0,
        timeSpent: Math.floor((Date.now() - quizStartTime) / 1000)
      }
      setResults(mockResults)
      setShowResults(true)
      setTimeLeft(null)
      return
    }

    const timeSpent = Math.floor((Date.now() - quizStartTime) / 1000)

    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: activeQuiz.id,
          answers,
          timeSpent
        })
      })

      if (response.ok) {
        const result = await response.json()
        setResults(result)
        setShowResults(true)
        setTimeLeft(null)
        
        // Nettoyer le progrès sauvegardé
        if (session?.user.role === 'CANDIDAT') {
          await fetch(`/api/quiz/progress?quizId=${activeQuiz.id}`, { method: 'DELETE' })
        }
        
        fetchAttempts()
      } else {
        const errorData = await response.json()
        alert(`Erreur lors de la soumission: ${errorData.error || 'Erreur inconnue'}`)
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      alert('Erreur lors de la soumission du quiz.')
    }
  }

  const createQuiz = async () => {
    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newQuiz,
          timeLimit: newQuiz.timeLimit ? parseInt(newQuiz.timeLimit) : null,
          passingScoreNormal: parseInt(newQuiz.passingScoreNormal),
          passingScoreToWatch: parseInt(newQuiz.passingScoreToWatch),
          questions: newQuiz.questions.map((q, index) => ({
            ...q,
            points: parseInt(q.points),
            correctAnswer: parseInt(q.correctAnswer),
            order: index
          }))
        })
      })

      if (response.ok) {
        setShowCreateFormPersistent(false)
        const resetQuiz = {
          title: '',
          description: '',
          timeLimit: '',
          passingScoreNormal: '80',
          passingScoreToWatch: '90',
          questions: [{ question: '', options: ['', '', '', ''], correctAnswer: '0', points: '1' }]
        }
        setNewQuizPersistent(resetQuiz)
        fetchQuizzes()
      }
    } catch (error) {
      console.error('Erreur lors de la création du quiz:', error)
    }
  }

  const deleteQuiz = async (quizId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce quiz ?')) return

    try {
      const response = await fetch(`/api/quiz?id=${quizId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchQuizzes()
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }

  const startEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz)
    setNewQuiz({
      title: quiz.title,
      description: quiz.description || '',
      timeLimit: quiz.timeLimit?.toString() || '',
      passingScoreNormal: quiz.passingScoreNormal.toString(),
      passingScoreToWatch: quiz.passingScoreToWatch.toString(),
      questions: quiz.questions?.map(q => ({
        question: q.question,
        options: Array.isArray(q.options) ? q.options : ['', '', '', ''],
        correctAnswer: q.correctAnswer.toString(),
        points: q.points.toString()
      })) || [{ question: '', options: ['', '', '', ''], correctAnswer: '0', points: '1' }]
    })
    setShowEditForm(true)
    setShowCreateFormPersistent(false)
  }

  const updateQuiz = async () => {
    if (!editingQuiz) return

    try {
      const response = await fetch(`/api/quiz?id=${editingQuiz.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newQuiz.title,
          description: newQuiz.description,
          timeLimit: newQuiz.timeLimit ? parseInt(newQuiz.timeLimit) : null,
          passingScoreNormal: parseInt(newQuiz.passingScoreNormal),
          passingScoreToWatch: parseInt(newQuiz.passingScoreToWatch),
          questions: newQuiz.questions.map((q, index) => ({
            ...q,
            points: parseInt(q.points),
            correctAnswer: parseInt(q.correctAnswer),
            order: index
          }))
        })
      })

      if (response.ok) {
        setShowEditForm(false)
        setEditingQuiz(null)
        setNewQuiz({
          title: '',
          description: '',
          timeLimit: '',
          passingScoreNormal: '80',
          passingScoreToWatch: '90',
          questions: [{ question: '', options: ['', '', '', ''], correctAnswer: '0', points: '1' }]
        })
        fetchQuizzes()
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du quiz:', error)
    }
  }

  const cancelEdit = () => {
    setShowEditForm(false)
    setEditingQuiz(null)
    setNewQuiz({
      title: '',
      description: '',
      timeLimit: '',
      passingScoreNormal: '80',
      passingScoreToWatch: '90',
      questions: [{ question: '', options: ['', '', '', ''], correctAnswer: '0', points: '1' }]
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Calculer le score actuel basé sur les réponses données
  const getCurrentScore = () => {
    if (!activeQuiz || !activeQuiz.questions) {
      return { correct: 0, total: 0, percentage: 0, totalQuestions: 0 }
    }
    
    let correctAnswers = 0
    let totalAnswered = 0
    
    activeQuiz.questions.forEach((question, questionIndex) => {
      const userAnswerIndex = answers[question.id]
      
      if (userAnswerIndex !== undefined && userAnswerIndex !== null) {
        totalAnswered++
        
        // Utiliser la même logique que le backend
        const userAnswerIndexNum = typeof userAnswerIndex === 'string' ? parseInt(userAnswerIndex, 10) : userAnswerIndex
        
        if (!isNaN(userAnswerIndexNum) && question.options && question.options[userAnswerIndexNum]) {
          // L'API retourne les options comme un tableau de strings
          const userAnswerText = question.options[userAnswerIndexNum]
          const isCorrect = userAnswerText === question.correctAnswer
          
          if (isCorrect) {
            correctAnswers++
          }
        }
      }
    })
    
    const percentage = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0
    
    return { 
      correct: correctAnswers, 
      total: totalAnswered, 
      totalQuestions: activeQuiz.questions.length,
      percentage 
    }
  }

  const addQuestion = () => {
    setNewQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, { question: '', options: ['', '', '', ''], correctAnswer: '0', points: '1' }]
    }))
  }

  const updateQuestion = (index: number, field: string, value: any) => {
    setNewQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }))
  }

  const removeQuestion = (index: number) => {
    if (newQuiz.questions.length > 1) {
      setNewQuiz(prev => ({
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index)
      }))
    }
  }

  const isAdmin = ['ADMIN', 'SUPERVISEUR', 'DIRECTEUR'].includes(session?.user.role || '')

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
              Chargement des quiz...
            </p>
          </div>
        </div>
      </>
    )
  }

  // Quiz Taking Interface
  if (activeQuiz && !showResults) {
    const currentQuestion = activeQuiz.questions?.[currentQuestionIndex]
    
    // Safety check to ensure questions and options exist
    if (!currentQuestion || !currentQuestion.options || !Array.isArray(currentQuestion.options)) {
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
              <div style={{fontSize: '48px'}}>⚠️</div>
              <p style={{...modernDesign.typography.body, color: '#d1d5db', textAlign: 'center'}}>
                Erreur lors du chargement des questions du quiz.<br/>
                Veuillez réessayer ou contacter l'administrateur.
              </p>
              <button
                onClick={() => setActiveQuiz(null)}
                className="quiz-btn-primary"
                style={{padding: '12px 24px'}}
              >
                ← Retour aux quiz
              </button>
            </div>
          </div>
        </>
      )
    }
    
    const progress = activeQuiz.questions?.length > 0 
      ? ((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100 
      : 0

    return (
      <>
        {styles}
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Animated Background Elements */}
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'modernFloat 6s ease-in-out infinite'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '20%',
            right: '10%',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'modernFloat 8s ease-in-out infinite reverse'
          }} />

          <div style={{
            position: 'relative',
            zIndex: 10,
            padding: '32px',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            {/* Quiz Header */}
            <div style={{
              ...modernDesign.glass.card,
              padding: '24px',
              marginBottom: '32px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h1 style={{
                  ...modernDesign.typography.title,
                  fontSize: '28px',
                  margin: '0 0 8px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{fontSize: '32px'}}>🎯</span>
                  {activeQuiz.title}
                </h1>
                <p style={{
                  ...modernDesign.typography.body,
                  margin: '0',
                  opacity: 0.8
                }}>
                  Question {currentQuestionIndex + 1} sur {activeQuiz.questions.length}
                </p>
              </div>
              
              <div style={{
                display: 'flex',
                gap: '24px',
                alignItems: 'center'
              }}>
                {/* Score en temps réel pour les candidats */}
                {session?.user.role === 'CANDIDAT' && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#3b82f6'
                    }}>
                      📊 {currentScore.correct}/{currentScore.totalQuestions}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#9ca3af'
                    }}>
                      Bonnes réponses
                    </div>
                  </div>
                )}
                
                {timeLeft !== null && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      color: timeLeft < 300 ? '#ef4444' : '#10b981'
                    }}>
                      ⏱️ {formatTime(timeLeft)}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#9ca3af'
                    }}>
                      Temps restant
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{
              ...modernDesign.glass.card,
              padding: '16px',
              marginBottom: '32px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#d1d5db'
                }}>
                  Progression
                </span>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#3b82f6'
                }}>
                  {Math.round(progress)}%
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                background: 'rgba(59, 130, 246, 0.2)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            {/* Question Card */}
            <div style={{
              ...modernDesign.glass.card,
              padding: '32px',
              marginBottom: '32px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Question background gradient */}
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
                <h2 style={{
                  ...modernDesign.typography.subtitle,
                  fontSize: '24px',
                  marginBottom: '32px',
                  lineHeight: '1.6'
                }}>
                  {currentQuestion.question}
                </h2>

                <div style={{
                  display: 'grid',
                  gap: '16px'
                }}>
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(currentQuestion.id, index.toString())}
                      style={{
                        ...modernDesign.glass.card,
                        padding: '20px',
                        textAlign: 'left',
                        border: answers[currentQuestion.id] === index.toString() 
                          ? '2px solid #3b82f6' 
                          : '1px solid rgba(59, 130, 246, 0.3)',
                        background: answers[currentQuestion.id] === index.toString()
                          ? 'rgba(59, 130, 246, 0.15)'
                          : 'rgba(15, 23, 42, 0.9)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontSize: '16px',
                        fontWeight: '500',
                        color: '#e5e7eb'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
                        e.currentTarget.style.background = answers[currentQuestion.id] === index.toString()
                          ? 'rgba(59, 130, 246, 0.25)'
                          : 'rgba(30, 41, 59, 0.9)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = '';
                        e.currentTarget.style.boxShadow = '';
                        e.currentTarget.style.background = answers[currentQuestion.id] === index.toString()
                          ? 'rgba(59, 130, 246, 0.15)'
                          : 'rgba(15, 23, 42, 0.9)';
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: answers[currentQuestion.id] === index.toString()
                            ? '2px solid #ffffff'
                            : '2px solid #3b82f6',
                          background: answers[currentQuestion.id] === index.toString()
                            ? '#3b82f6'
                            : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: answers[currentQuestion.id] === index.toString()
                            ? '#ffffff'
                            : '#3b82f6'
                        }}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span style={{
                          color: '#e5e7eb',
                          lineHeight: '1.5'
                        }}>
                          {option}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <button
                onClick={() => {
                  const newIndex = Math.max(0, currentQuestionIndex - 1)
                  setCurrentQuestionIndex(newIndex)
                  // Sauvegarder le progrès quand on change de question
                  if (session?.user.role === 'CANDIDAT') {
                    setTimeout(() => saveQuizProgress(), 200)
                  }
                }}
                disabled={currentQuestionIndex === 0}
                className={`quiz-btn-secondary ${currentQuestionIndex === 0 ? 'quiz-btn-disabled' : ''}`}
                style={{
                  padding: '16px 24px'
                }}
              >
                ← Précédent
              </button>
              
              {currentQuestionIndex === activeQuiz.questions.length - 1 ? (
                <button
                  onClick={handleSubmitQuiz}
                  className="quiz-btn-success"
                  style={{
                    padding: '16px 32px'
                  }}
                >
                  🎯 Terminer le quiz
                </button>
              ) : (
                <button
                  onClick={() => {
                    const newIndex = Math.min(activeQuiz.questions.length - 1, currentQuestionIndex + 1)
                    setCurrentQuestionIndex(newIndex)
                    // Sauvegarder le progrès quand on change de question
                    if (session?.user.role === 'CANDIDAT') {
                      setTimeout(() => saveQuizProgress(), 200)
                    }
                  }}
                  className="quiz-btn-primary"
                  style={{
                    padding: '16px 24px'
                  }}
                >
                  Suivant →
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    )
  }

  // Results Display
  if (showResults && results) {
    return (
      <>
        {styles}
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px'
        }}>
          {/* Animated Background Elements */}
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '20%',
            width: '200px',
            height: '200px',
            background: results.passed 
              ? 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'modernFloat 4s ease-in-out infinite'
          }} />

          <div style={{
            ...modernDesign.glass.card,
            padding: '48px',
            maxWidth: '600px',
            width: '100%',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            animation: 'modernScale 0.6s ease-out'
          }}>
            {/* Results background gradient */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: results.passed
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
              opacity: 0.5
            }} />

            <div style={{position: 'relative', zIndex: 1}}>
              {/* Result Icon */}
              <div style={{
                fontSize: '80px',
                marginBottom: '24px',
                animation: 'modernPulse 2s ease-in-out infinite'
              }}>
                ✅
              </div>

              {/* Result Title */}
              <h2 style={{
                ...modernDesign.typography.title,
                fontSize: '32px',
                marginBottom: '16px',
                color: '#3b82f6'
              }}>
                Quiz terminé
              </h2>

              {/* Confirmation Message - Sans révéler le score */}
              <div style={{
                ...modernDesign.glass.card,
                padding: '24px',
                marginBottom: '32px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '18px',
                  color: '#ffffff',
                  marginBottom: '8px'
                }}>
                  Votre quiz a été soumis avec succès
                </div>
                <div style={{
                  fontSize: '16px',
                  color: '#d1d5db'
                }}>
                  Les résultats seront communiqués par l'équipe pédagogique
                </div>
              </div>

              {/* Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '16px',
                marginBottom: '32px'
              }}>
                <div style={{
                  ...modernDesign.glass.card,
                  padding: '16px'
                }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#8b5cf6',
                    marginBottom: '4px'
                  }}>
                    {activeQuiz?.questions.length}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#9ca3af'
                  }}>
                    Total questions
                  </div>
                </div>
                
                <div style={{
                  ...modernDesign.glass.card,
                  padding: '16px'
                }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#10b981',
                    marginBottom: '4px'
                  }}>
                    {Math.floor((results.timeSpent || 0) / 60)}m {((results.timeSpent || 0) % 60)}s
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#9ca3af'
                  }}>
                    Temps écoulé
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  setActiveQuiz(null)
                  setShowResults(false)
                  setResults(null)
                }}
                className="quiz-btn-primary"
                style={{
                  padding: '16px 32px',
                  fontSize: '16px'
                }}
              >
                ← Retour aux quiz
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Main Quiz Dashboard
  return (
    <>
      {styles}
      
      {/* Vérification d'accès pour les candidats */}
      {session?.user.role === 'CANDIDAT' && !interviewStatus.canAccessQuizzes && (
        <div style={{
          background: 'rgba(17, 24, 39, 0.8)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '48px',
          marginBottom: '32px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '24px'
          }}>🚫</div>
          <h2 style={{
            color: 'white',
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '16px'
          }}>Accès aux Quiz Restreint</h2>
          <p style={{
            color: '#9ca3af',
            fontSize: '16px',
            lineHeight: '1.6',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            {interviewStatus.message || 'Vous devez terminer votre entretien avant d\'accéder aux quiz.'}
          </p>
        </div>
      )}
      
      {/* Contenu principal - affiché seulement si autorisé ou si admin */}
      {(session?.user.role !== 'CANDIDAT' || interviewStatus.canAccessQuizzes) && (
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
              }}>🧠</span>
              {session?.user.role === 'CANDIDAT' ? 'Mes Quiz' : 'Gestion des Quiz'}
            </h1>
            <p style={{
              ...modernDesign.typography.body,
              fontSize: '16px',
              margin: '0'
            }}>
              {session?.user.role === 'CANDIDAT' 
                ? 'Complétez vos quiz assignés'
                : 'Créez et gérez les quiz pour les candidats'
              }
            </p>
          </div>
          
          {isAdmin && (
            <button
              onClick={() => setShowCreateFormPersistent(true)}
              className="quiz-btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '16px',
                padding: '16px 24px'
              }}
            >
              <span style={{fontSize: '20px'}}>➕</span>
              <span>Nouveau Quiz</span>
            </button>
          )}
        </div>

        {/* Quiz Creation Form */}
        {showCreateForm && isAdmin && (
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
                Créer un nouveau quiz
              </h3>
              
              {/* Quiz Info Form */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '24px',
                marginBottom: '32px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#d1d5db',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    Titre du quiz
                  </label>
                  <input
                    type="text"
                    value={newQuiz.title}
                    onChange={(e) => setNewQuiz({...newQuiz, title: e.target.value})}
                    className="quiz-form-input"
                    placeholder="Ex: Quiz de culture générale"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#d1d5db',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    Limite de temps (minutes)
                  </label>
                  <input
                    type="number"
                    value={newQuiz.timeLimit}
                    onChange={(e) => setNewQuiz({...newQuiz, timeLimit: e.target.value})}
                    style={{
                      ...modernDesign.inputs.modern,
                      width: '100%'
                    }}
                    placeholder="Ex: 30"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#d1d5db',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    Score candidats normaux (%)
                  </label>
                  <input
                    type="number"
                    value={newQuiz.passingScoreNormal}
                    onChange={(e) => setNewQuiz({...newQuiz, passingScoreNormal: e.target.value})}
                    min="0"
                    max="100"
                    style={{
                      ...modernDesign.inputs.modern,
                      width: '100%'
                    }}
                    placeholder="80"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#d1d5db',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    Score candidats à surveiller (%)
                  </label>
                  <input
                    type="number"
                    value={newQuiz.passingScoreToWatch}
                    onChange={(e) => setNewQuiz({...newQuiz, passingScoreToWatch: e.target.value})}
                    min="0"
                    max="100"
                    style={{
                      ...modernDesign.inputs.modern,
                      width: '100%'
                    }}
                    placeholder="90"
                  />
                </div>
              </div>

              <div style={{marginBottom: '32px'}}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#d1d5db',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  Description
                </label>
                <textarea
                  value={newQuiz.description}
                  onChange={(e) => setNewQuiz({...newQuiz, description: e.target.value})}
                  style={{
                    ...modernDesign.inputs.modern,
                    width: '100%',
                    minHeight: '100px',
                    resize: 'vertical'
                  }}
                  placeholder="Description du quiz..."
                />
              </div>

              {/* Questions Section */}
              <div style={{marginBottom: '32px'}}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px'
                }}>
                  <h4 style={{
                    ...modernDesign.typography.subtitle,
                    fontSize: '20px',
                    margin: '0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{fontSize: '24px'}}>❓</span>
                    Questions ({newQuiz.questions.length})
                  </h4>
                  <button
                    onClick={addQuestion}
                    className="quiz-btn-secondary"
                    style={{
                      fontSize: '14px',
                      padding: '12px 20px'
                    }}
                  >
                    ➕ Ajouter une question
                  </button>
                </div>

                <div style={{
                  display: 'grid',
                  gap: '24px'
                }}>
                  {newQuiz.questions.map((question, questionIndex) => (
                    <div
                      key={questionIndex}
                      style={{
                        ...modernDesign.glass.card,
                        padding: '24px',
                        border: '1px solid rgba(139, 92, 246, 0.3)'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px'
                      }}>
                        <h5 style={{
                          margin: '0',
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#e5e7eb'
                        }}>
                          Question {questionIndex + 1}
                        </h5>
                        {newQuiz.questions.length > 1 && (
                          <button
                            onClick={() => removeQuestion(questionIndex)}
                            className="quiz-btn-danger"
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px'
                            }}
                          >
                            🗑️ Supprimer
                          </button>
                        )}
                      </div>

                      <div style={{marginBottom: '16px'}}>
                        <label style={{
                          display: 'block',
                          marginBottom: '8px',
                          color: '#d1d5db',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          Énoncé de la question
                        </label>
                        <textarea
                          value={question.question}
                          onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                          style={{
                            ...modernDesign.inputs.modern,
                            width: '100%',
                            minHeight: '80px',
                            resize: 'vertical'
                          }}
                          placeholder="Saisissez votre question..."
                        />
                      </div>

                      <div style={{
                        display: 'grid',
                        gap: '12px',
                        marginBottom: '16px'
                      }}>
                        <label style={{
                          color: '#d1d5db',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          Options de réponse
                        </label>
                        {question.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            style={{
                              display: 'flex',
                              gap: '12px',
                              alignItems: 'center'
                            }}
                          >
                            <input
                              type="radio"
                              name={`correct-${questionIndex}`}
                              checked={question.correctAnswer === optionIndex.toString()}
                              onChange={() => updateQuestion(questionIndex, 'correctAnswer', optionIndex.toString())}
                              style={{
                                width: '20px',
                                height: '20px',
                                accentColor: '#3b82f6'
                              }}
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...question.options]
                                newOptions[optionIndex] = e.target.value
                                updateQuestion(questionIndex, 'options', newOptions)
                              }}
                              style={{
                                ...modernDesign.inputs.modern,
                                flex: 1
                              }}
                              placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label style={{
                          display: 'block',
                          marginBottom: '8px',
                          color: '#d1d5db',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          Points
                        </label>
                        <input
                          type="number"
                          value={question.points}
                          onChange={(e) => updateQuestion(questionIndex, 'points', e.target.value)}
                          min="1"
                          style={{
                            ...modernDesign.inputs.modern,
                            width: '100px'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Form Actions */}
              <div style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setShowCreateFormPersistent(false)}
                  className="quiz-btn-secondary"
                  style={{
                    padding: '14px 28px'
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={createQuiz}
                  className="quiz-btn-success"
                  style={{
                    padding: '14px 28px'
                  }}
                >
                  ✨ Créer le quiz
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quiz Edit Form */}
        {showEditForm && editingQuiz && isAdmin && (
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
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
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
                <span style={{fontSize: '28px'}}>✏️</span>
                Modifier le quiz: {editingQuiz.title}
              </h3>
              
              {/* Quiz Info Form */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '24px',
                marginBottom: '32px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#d1d5db',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    Titre du quiz
                  </label>
                  <input
                    type="text"
                    value={newQuiz.title}
                    onChange={(e) => setNewQuiz({...newQuiz, title: e.target.value})}
                    className="quiz-form-input"
                    placeholder="Ex: Quiz de culture générale"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#d1d5db',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    Limite de temps (minutes)
                  </label>
                  <input
                    type="number"
                    value={newQuiz.timeLimit}
                    onChange={(e) => setNewQuiz({...newQuiz, timeLimit: e.target.value})}
                    style={{
                      ...modernDesign.inputs.modern,
                      width: '100%'
                    }}
                    placeholder="Ex: 30"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#d1d5db',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    Score candidats normaux (%)
                  </label>
                  <input
                    type="number"
                    value={newQuiz.passingScoreNormal}
                    onChange={(e) => setNewQuiz({...newQuiz, passingScoreNormal: e.target.value})}
                    min="0"
                    max="100"
                    style={{
                      ...modernDesign.inputs.modern,
                      width: '100%'
                    }}
                    placeholder="80"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#d1d5db',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    Score candidats à surveiller (%)
                  </label>
                  <input
                    type="number"
                    value={newQuiz.passingScoreToWatch}
                    onChange={(e) => setNewQuiz({...newQuiz, passingScoreToWatch: e.target.value})}
                    min="0"
                    max="100"
                    style={{
                      ...modernDesign.inputs.modern,
                      width: '100%'
                    }}
                    placeholder="90"
                  />
                </div>
              </div>

              <div style={{marginBottom: '32px'}}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#d1d5db',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  Description
                </label>
                <textarea
                  value={newQuiz.description}
                  onChange={(e) => setNewQuiz({...newQuiz, description: e.target.value})}
                  style={{
                    ...modernDesign.inputs.modern,
                    width: '100%',
                    minHeight: '100px',
                    resize: 'vertical'
                  }}
                  placeholder="Description du quiz..."
                />
              </div>

              {/* Questions Section */}
              <div style={{marginBottom: '32px'}}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px'
                }}>
                  <h4 style={{
                    ...modernDesign.typography.subtitle,
                    fontSize: '20px',
                    margin: '0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{fontSize: '24px'}}>❓</span>
                    Questions ({newQuiz.questions.length})
                  </h4>
                  <button
                    onClick={addQuestion}
                    className="quiz-btn-secondary"
                    style={{
                      fontSize: '14px',
                      padding: '12px 20px'
                    }}
                  >
                    ➕ Ajouter une question
                  </button>
                </div>

                <div style={{
                  display: 'grid',
                  gap: '24px'
                }}>
                  {newQuiz.questions.map((question, questionIndex) => (
                    <div
                      key={questionIndex}
                      style={{
                        ...modernDesign.glass.card,
                        padding: '24px',
                        border: '1px solid rgba(139, 92, 246, 0.3)'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px'
                      }}>
                        <h5 style={{
                          margin: '0',
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#e5e7eb'
                        }}>
                          Question {questionIndex + 1}
                        </h5>
                        {newQuiz.questions.length > 1 && (
                          <button
                            onClick={() => removeQuestion(questionIndex)}
                            className="quiz-btn-danger"
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px'
                            }}
                          >
                            🗑️ Supprimer
                          </button>
                        )}
                      </div>

                      <div style={{marginBottom: '16px'}}>
                        <label style={{
                          display: 'block',
                          marginBottom: '8px',
                          color: '#d1d5db',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          Énoncé de la question
                        </label>
                        <textarea
                          value={question.question}
                          onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                          style={{
                            ...modernDesign.inputs.modern,
                            width: '100%',
                            minHeight: '80px',
                            resize: 'vertical'
                          }}
                          placeholder="Saisissez votre question..."
                        />
                      </div>

                      <div style={{
                        display: 'grid',
                        gap: '12px',
                        marginBottom: '16px'
                      }}>
                        <label style={{
                          color: '#d1d5db',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          Options de réponse
                        </label>
                        {question.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            style={{
                              display: 'flex',
                              gap: '12px',
                              alignItems: 'center'
                            }}
                          >
                            <input
                              type="radio"
                              name={`correct-edit-${questionIndex}`}
                              checked={question.correctAnswer === optionIndex.toString()}
                              onChange={() => updateQuestion(questionIndex, 'correctAnswer', optionIndex.toString())}
                              style={{
                                width: '20px',
                                height: '20px',
                                accentColor: '#3b82f6'
                              }}
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...question.options]
                                newOptions[optionIndex] = e.target.value
                                updateQuestion(questionIndex, 'options', newOptions)
                              }}
                              style={{
                                ...modernDesign.inputs.modern,
                                flex: 1
                              }}
                              placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label style={{
                          display: 'block',
                          marginBottom: '8px',
                          color: '#d1d5db',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          Points
                        </label>
                        <input
                          type="number"
                          value={question.points}
                          onChange={(e) => updateQuestion(questionIndex, 'points', e.target.value)}
                          min="1"
                          style={{
                            ...modernDesign.inputs.modern,
                            width: '100px'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Form Actions */}
              <div style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={cancelEdit}
                  className="quiz-btn-secondary"
                  style={{
                    padding: '14px 28px'
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={updateQuiz}
                  className="quiz-btn-success"
                  style={{
                    padding: '14px 28px'
                  }}
                >
                  💾 Mettre à jour le quiz
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quiz Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {quizzes.map((quiz, index) => (
            <div
              key={quiz.id}
              style={{
                ...modernDesign.glass.card,
                position: 'relative',
                overflow: 'hidden',
                padding: '24px',
                animation: `modernSlideIn 0.5s ease-out ${index * 0.1}s both`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(59, 130, 246, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              {/* Quiz Status Badge */}
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                ...modernDesign.badges.info,
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981'
              }}>
                Actif
              </div>

              {/* Quiz Header */}
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
                  <span style={{fontSize: '24px'}}>🧠</span>
                  {quiz.title}
                </h3>
                <p style={{
                  color: '#9ca3af',
                  margin: '0 0 12px 0',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  {quiz.description}
                </p>
                {quiz.sessionName && (
                  <p style={{
                    color: '#3b82f6',
                    margin: '0',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    📋 Session: {quiz.sessionName}
                  </p>
                )}
              </div>

              {/* Quiz Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div style={{
                  ...modernDesign.glass.card,
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#3b82f6',
                    marginBottom: '4px'
                  }}>
                    {quiz._count?.questions || quiz.questions?.length || 0}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    Questions
                  </div>
                </div>
                
                <div style={{
                  ...modernDesign.glass.card,
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#8b5cf6',
                    marginBottom: '4px'
                  }}>
                    {quiz.timeLimit || '∞'}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    Minutes
                  </div>
                </div>
                
                <div style={{
                  ...modernDesign.glass.card,
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#10b981',
                    marginBottom: '4px'
                  }}>
                    {quiz.passingScoreNormal}% / {quiz.passingScoreToWatch}%
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    Réussite
                  </div>
                </div>
              </div>

              {/* Previous Attempt Display */}
              {quiz.hasAttempt && (
                <div style={{
                  ...modernDesign.glass.card,
                  padding: '16px',
                  marginBottom: '16px',
                  background: quiz.attemptPassed
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(239, 68, 68, 0.1)',
                  border: quiz.attemptPassed
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                  <p style={{
                    margin: '0',
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    Quiz terminé
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <QuizActionButtons 
                quiz={quiz} 
                session={session} 
                onStartQuiz={startQuiz}
                onEditQuiz={startEditQuiz}
                onDeleteQuiz={deleteQuiz}
                checkProgress={checkQuizProgress}
              />
            </div>
          ))}
        </div>

        {/* Empty State */}
        {quizzes.length === 0 && (
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
              🧠
            </div>
            <h3 style={{
              ...modernDesign.typography.subtitle,
              fontSize: '24px',
              marginBottom: '12px'
            }}>
              {session?.user.role === 'CANDIDAT' ? 'Aucun quiz disponible' : 'Aucun quiz créé'}
            </h3>
            <p style={{
              ...modernDesign.typography.body,
              fontSize: '16px',
              marginBottom: '24px',
              opacity: 0.8
            }}>
              {session?.user.role === 'CANDIDAT' 
                ? 'Aucun quiz ne vous a été assigné pour le moment'
                : 'Commencez par créer votre premier quiz'
              }
            </p>
            {isAdmin && (
              <button
                onClick={() => setShowCreateFormPersistent(true)}
                className="quiz-btn-primary"
                style={{
                  padding: '16px 32px',
                  fontSize: '16px'
                }}
              >
                ✨ Créer mon premier quiz
              </button>
            )}
          </div>
        )}

        {/* Attempts History for Candidates */}
        {session?.user.role === 'CANDIDAT' && attempts.length > 0 && (
          <div style={{
            ...modernDesign.glass.card,
            padding: '32px',
            marginTop: '32px'
          }}>
            <h3 style={{
              ...modernDesign.typography.subtitle,
              fontSize: '24px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{fontSize: '28px'}}>📊</span>
              Historique des tentatives
            </h3>
            
            <div style={{
              display: 'grid',
              gap: '16px'
            }}>
              {attempts.map((attempt, index) => (
                <div
                  key={attempt.id}
                  style={{
                    ...modernDesign.glass.card,
                    padding: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    animation: `modernSlideIn 0.3s ease-out ${index * 0.1}s both`
                  }}
                >
                  <div>
                    <h4 style={{
                      margin: '0 0 8px 0',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#e5e7eb'
                    }}>
                      {attempt.quiz.title}
                    </h4>
                    <div style={{
                      display: 'flex',
                      gap: '16px',
                      fontSize: '14px',
                      color: '#9ca3af'
                    }}>
                      <span>📅 {new Date(attempt.completedAt).toLocaleDateString('fr-FR')}</span>
                      {attempt.session && <span>📋 {attempt.session.name}</span>}
                      {attempt.timeSpent && <span>⏱️ {Math.floor(attempt.timeSpent / 60)}m</span>}
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}>
                    <div style={{
                      ...modernDesign.badges.info,
                      background: 'rgba(59, 130, 246, 0.2)',
                      color: '#3b82f6',
                      fontSize: '14px',
                      fontWeight: '700'
                    }}>
                      Terminé
                    </div>
                    <span style={{
                      fontSize: '20px'
                    }}>
                      ✓
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      )}
    </>
  )
}

// Composant pour gérer les boutons d'action avec la logique anti-triche
function QuizActionButtons({ 
  quiz, 
  session, 
  onStartQuiz, 
  onEditQuiz, 
  onDeleteQuiz, 
  checkProgress 
}: {
  quiz: Quiz
  session: any
  onStartQuiz: (quiz: Quiz, forceRestart?: boolean) => void
  onEditQuiz: (quiz: Quiz) => void
  onDeleteQuiz: (quizId: string) => void
  checkProgress: (quizId: string) => Promise<any>
}) {
  const [hasProgress, setHasProgress] = useState(false)
  const [progressInfo, setProgressInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session?.user.role === 'CANDIDAT') {
      checkForProgress()
    }
  }, [quiz.id, session])

  const checkForProgress = async () => {
    setLoading(true)
    try {
      const progress = await checkProgress(quiz.id)
      setHasProgress(!!progress)
      setProgressInfo(progress)
    } catch (error) {
      console.error('Erreur lors de la vérification du progrès:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartQuiz = () => {
    onStartQuiz(quiz, false)
  }

  const handleRestartQuiz = () => {
    if (confirm('Êtes-vous sûr de vouloir recommencer ce quiz ? Votre progrès actuel sera perdu.')) {
      onStartQuiz(quiz, true)
    }
  }

  if (session?.user.role === 'CANDIDAT') {
    // Si le quiz a déjà été passé, afficher seulement le statut
    if (quiz.hasAttempt) {
      return (
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div style={{
            flex: '1',
            padding: '12px 16px',
            borderRadius: '8px',
            background: quiz.attemptPassed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: quiz.attemptPassed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: quiz.attemptPassed ? '#10b981' : '#ef4444',
              marginBottom: '4px'
            }}>
              {quiz.attemptPassed ? '✅ Quiz réussi' : '❌ Quiz échoué'}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#9ca3af'
            }}>
              Score: {quiz.attemptScore}%
            </div>
          </div>
        </div>
      )
    }

    return (
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        {hasProgress ? (
          <>
            <button
              onClick={handleStartQuiz}
              className="quiz-btn-success"
              style={{
                flex: '1',
                minWidth: '100px',
                fontSize: '14px',
                padding: '12px 16px'
              }}
              disabled={loading}
            >
              ▶️ Continuer
              {progressInfo && (
                <div style={{fontSize: '11px', opacity: 0.8, marginTop: '2px'}}>
                  Question {progressInfo.currentQuestionIndex + 1} - {Math.floor(progressInfo.timeLeft / 60)}:{(progressInfo.timeLeft % 60).toString().padStart(2, '0')}
                </div>
              )}
            </button>
            <div style={{
              minWidth: '80px',
              fontSize: '11px',
              padding: '8px 12px',
              color: '#9ca3af',
              textAlign: 'center',
              border: '1px solid #374151',
              borderRadius: '8px',
              background: 'rgba(17, 24, 39, 0.3)'
            }}>
              � Recommencer<br/>non autorisé
            </div>
          </>
        ) : (
          <button
            onClick={handleStartQuiz}
            className="quiz-btn-primary"
            style={{
              flex: '1',
              minWidth: '120px',
              fontSize: '14px',
              padding: '12px 16px'
            }}
            disabled={loading}
          >
            🎯 Commencer
          </button>
        )}
      </div>
    )
  }

  // Boutons pour les admins
  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap'
    }}>
      <button
        onClick={handleStartQuiz}
        className="quiz-btn-secondary"
        style={{
          flex: '1',
          minWidth: '90px',
          fontSize: '14px',
          padding: '12px 16px'
        }}
      >
        👁️ Prévisualiser
      </button>
      <button
        onClick={() => onEditQuiz(quiz)}
        className="quiz-btn-primary"
        style={{
          flex: '1',
          minWidth: '90px',
          fontSize: '14px',
          padding: '12px 16px'
        }}
      >
        ✏️ Modifier
      </button>
      <button
        onClick={() => onDeleteQuiz(quiz.id)}
        className="quiz-btn-danger"
        style={{
          flex: '1',
          minWidth: '90px',
          fontSize: '14px',
          padding: '12px 16px'
        }}
      >
        🗑️ Supprimer
      </button>
    </div>
  )
}
