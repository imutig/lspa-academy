'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { modernDesign } from '../utils/modernDesign'

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
  passingScore: number
  isActive: boolean
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
    passingScore: number
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
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const [newQuiz, setNewQuiz] = useState({
    title: '',
    description: '',
    timeLimit: '',
    passingScore: '70',
    questions: [{ question: '', options: ['', '', '', ''], correctAnswer: '0', points: '1' }]
  })

  useEffect(() => {
    fetchQuizzes()
    if (session?.user.role === 'CANDIDAT') {
      fetchAttempts()
    }
    setTimeout(() => setIsLoaded(true), 100)
  }, [session])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (timeLeft && timeLeft > 0 && activeQuiz && !showResults) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
    } else if (timeLeft === 0) {
      handleSubmitQuiz()
    }
    return () => clearTimeout(timer)
  }, [timeLeft, activeQuiz, showResults])

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

  const startQuiz = async (quiz: Quiz) => {
    try {
      const response = await fetch(`/api/quiz?id=${quiz.id}&includeQuestions=true`)
      if (response.ok) {
        const fullQuiz = await response.json()
        setActiveQuiz(fullQuiz)
        setCurrentQuestionIndex(0)
        setAnswers({})
        setQuizStartTime(Date.now())
        if (fullQuiz.timeLimit) {
          setTimeLeft(fullQuiz.timeLimit * 60) // Convert minutes to seconds
        }
        setShowResults(false)
      }
    } catch (error) {
      console.error('Erreur lors du démarrage du quiz:', error)
    }
  }

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmitQuiz = async () => {
    if (!activeQuiz || !quizStartTime) return

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
        fetchAttempts()
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
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
          passingScore: parseInt(newQuiz.passingScore),
          questions: newQuiz.questions.map((q, index) => ({
            ...q,
            points: parseInt(q.points),
            correctAnswer: parseInt(q.correctAnswer),
            order: index
          }))
        })
      })

      if (response.ok) {
        setShowCreateForm(false)
        setNewQuiz({
          title: '',
          description: '',
          timeLimit: '',
          passingScore: '70',
          questions: [{ question: '', options: ['', '', '', ''], correctAnswer: '0', points: '1' }]
        })
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
    const currentQuestion = activeQuiz.questions[currentQuestionIndex]
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
                          ? 'rgba(59, 130, 246, 0.1)'
                          : 'rgba(15, 23, 42, 0.8)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontSize: '16px',
                        fontWeight: '500'
                      }}
                      {...createHoverEffect(
                        {},
                        {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)'
                        }
                      )}
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
                          border: '2px solid #3b82f6',
                          background: answers[currentQuestion.id] === index.toString()
                            ? '#3b82f6'
                            : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: 'white'
                        }}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span>{option}</span>
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
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                style={{
                  ...modernDesign.buttons.secondary,
                  padding: '16px 24px',
                  opacity: currentQuestionIndex === 0 ? 0.5 : 1,
                  cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer'
                }}
                {...(currentQuestionIndex > 0 ? createHoverEffect(
                  {},
                  {
                    transform: 'translateY(-2px)',
                    background: 'rgba(59, 130, 246, 0.2)'
                  }
                ) : {})}
              >
                ← Précédent
              </button>
              
              {currentQuestionIndex === activeQuiz.questions.length - 1 ? (
                <button
                  onClick={handleSubmitQuiz}
                  style={{
                    ...modernDesign.buttons.primary,
                    padding: '16px 32px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                  }}
                  {...createHoverEffect(
                    {},
                    {
                      transform: 'translateY(-2px) scale(1.02)',
                      boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)'
                    }
                  )}
                >
                  🎯 Terminer le quiz
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestionIndex(Math.min(activeQuiz.questions.length - 1, currentQuestionIndex + 1))}
                  style={{
                    ...modernDesign.buttons.primary,
                    padding: '16px 24px'
                  }}
                  {...createHoverEffect(
                    {},
                    {
                      transform: 'translateY(-2px) scale(1.02)',
                      boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)'
                    }
                  )}
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
                {results.passed ? '🎉' : '😞'}
              </div>

              {/* Result Title */}
              <h2 style={{
                ...modernDesign.typography.title,
                fontSize: '32px',
                marginBottom: '16px',
                color: results.passed ? '#10b981' : '#ef4444'
              }}>
                {results.passed ? 'Félicitations !' : 'Quiz échoué'}
              </h2>

              {/* Score Display */}
              <div style={{
                ...modernDesign.glass.card,
                padding: '24px',
                marginBottom: '32px',
                background: results.passed
                  ? 'rgba(16, 185, 129, 0.1)'
                  : 'rgba(239, 68, 68, 0.1)',
                border: results.passed
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                <div style={{
                  fontSize: '48px',
                  fontWeight: '700',
                  color: results.passed ? '#10b981' : '#ef4444',
                  marginBottom: '8px'
                }}>
                  {results.score}%
                </div>
                <div style={{
                  fontSize: '16px',
                  color: '#d1d5db'
                }}>
                  Score requis: {activeQuiz?.passingScore}%
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
                    color: '#3b82f6',
                    marginBottom: '4px'
                  }}>
                    {results.correctAnswers}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#9ca3af'
                  }}>
                    Bonnes réponses
                  </div>
                </div>
                
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
                    {Math.floor((results.timeSpent || 0) / 60)}m
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
                style={{
                  ...modernDesign.buttons.primary,
                  padding: '16px 32px',
                  fontSize: '16px'
                }}
                {...createHoverEffect(
                  {},
                  {
                    transform: 'translateY(-2px) scale(1.05)',
                    boxShadow: '0 12px 30px rgba(59, 130, 246, 0.4)'
                  }
                )}
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
              onClick={() => setShowCreateForm(true)}
              style={{
                ...modernDesign.buttons.primary,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '16px',
                padding: '16px 24px',
                position: 'relative',
                overflow: 'hidden'
              }}
              {...createHoverEffect(
                {},
                {
                  transform: 'translateY(-2px) scale(1.05)',
                  boxShadow: '0 12px 30px rgba(59, 130, 246, 0.4)'
                }
              )}
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
                    style={{
                      ...modernDesign.inputs.modern,
                      width: '100%'
                    }}
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
                    Score de réussite (%)
                  </label>
                  <input
                    type="number"
                    value={newQuiz.passingScore}
                    onChange={(e) => setNewQuiz({...newQuiz, passingScore: e.target.value})}
                    min="0"
                    max="100"
                    style={{
                      ...modernDesign.inputs.modern,
                      width: '100%'
                    }}
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
                    style={{
                      ...modernDesign.buttons.secondary,
                      fontSize: '14px',
                      padding: '12px 20px'
                    }}
                    {...createHoverEffect(
                      {},
                      {
                        background: 'rgba(59, 130, 246, 0.2)',
                        transform: 'scale(1.05)'
                      }
                    )}
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
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#fca5a5',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                            {...createHoverEffect(
                              {},
                              {
                                background: 'rgba(239, 68, 68, 0.2)',
                                transform: 'scale(1.05)'
                              }
                            )}
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
                  onClick={() => setShowCreateForm(false)}
                  style={{
                    ...modernDesign.buttons.secondary,
                    padding: '14px 28px'
                  }}
                  {...createHoverEffect(
                    {},
                    {
                      background: 'rgba(59, 130, 246, 0.1)',
                      transform: 'translateY(-1px)'
                    }
                  )}
                >
                  Annuler
                </button>
                <button
                  onClick={createQuiz}
                  style={{
                    ...modernDesign.buttons.primary,
                    padding: '14px 28px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                  }}
                  {...createHoverEffect(
                    {},
                    {
                      transform: 'translateY(-2px) scale(1.02)',
                      boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)'
                    }
                  )}
                >
                  ✨ Créer le quiz
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
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              {...createHoverEffect(
                {},
                {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: '0 20px 40px rgba(59, 130, 246, 0.2)'
                }
              )}
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
                background: quiz.isActive 
                  ? 'rgba(16, 185, 129, 0.2)' 
                  : 'rgba(156, 163, 175, 0.2)',
                color: quiz.isActive ? '#10b981' : '#9ca3af'
              }}>
                {quiz.isActive ? 'Actif' : 'Inactif'}
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
                    {quiz.passingScore}%
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
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <span style={{fontSize: '16px'}}>
                      {quiz.attemptPassed ? '✅' : '❌'}
                    </span>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: quiz.attemptPassed ? '#10b981' : '#ef4444'
                    }}>
                      Dernier résultat: {quiz.attemptScore}%
                    </span>
                  </div>
                  <p style={{
                    margin: '0',
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    {quiz.attemptPassed ? 'Quiz réussi' : 'Quiz échoué'}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                {session?.user.role === 'CANDIDAT' ? (
                  <button
                    onClick={() => startQuiz(quiz)}
                    disabled={!quiz.isActive}
                    style={{
                      ...modernDesign.buttons.primary,
                      flex: '1',
                      minWidth: '120px',
                      fontSize: '14px',
                      padding: '12px 16px',
                      opacity: quiz.isActive ? 1 : 0.5,
                      cursor: quiz.isActive ? 'pointer' : 'not-allowed'
                    }}
                    {...(quiz.isActive ? createHoverEffect(
                      {},
                      {
                        transform: 'scale(1.05)',
                        boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)'
                      }
                    ) : {})}
                  >
                    🎯 {quiz.hasAttempt ? 'Reprendre' : 'Commencer'}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => startQuiz(quiz)}
                      style={{
                        ...modernDesign.buttons.secondary,
                        flex: '1',
                        minWidth: '100px',
                        fontSize: '14px',
                        padding: '12px 16px'
                      }}
                      {...createHoverEffect(
                        {},
                        {
                          background: 'rgba(59, 130, 246, 0.2)',
                          transform: 'scale(1.05)'
                        }
                      )}
                    >
                      👁️ Prévisualiser
                    </button>
                    <button
                      onClick={() => deleteQuiz(quiz.id)}
                      style={{
                        ...modernDesign.buttons.secondary,
                        flex: '1',
                        minWidth: '100px',
                        fontSize: '14px',
                        padding: '12px 16px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#fca5a5'
                      }}
                      {...createHoverEffect(
                        {},
                        {
                          background: 'rgba(239, 68, 68, 0.2)',
                          transform: 'scale(1.05)'
                        }
                      )}
                    >
                      🗑️ Supprimer
                    </button>
                  </>
                )}
              </div>
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
                onClick={() => setShowCreateForm(true)}
                style={{
                  ...modernDesign.buttons.primary,
                  padding: '16px 32px',
                  fontSize: '16px'
                }}
                {...createHoverEffect(
                  {},
                  {
                    transform: 'translateY(-2px) scale(1.05)',
                    boxShadow: '0 12px 30px rgba(59, 130, 246, 0.4)'
                  }
                )}
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
                      background: attempt.passed
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(239, 68, 68, 0.2)',
                      color: attempt.passed ? '#10b981' : '#ef4444',
                      fontSize: '14px',
                      fontWeight: '700'
                    }}>
                      {attempt.score}%
                    </div>
                    <span style={{
                      fontSize: '20px'
                    }}>
                      {attempt.passed ? '✅' : '❌'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
