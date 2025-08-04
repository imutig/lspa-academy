'use client'

import { useState, useEffect } from 'react'

interface Quiz {
  id: string
  title: string
  description?: string
  timeLimit: number
  passingScoreNormal: number
  passingScoreToWatch: number
  createdAt: string
  _count: {
    questions: number
    attempts: number
    sessionQuizzes: number
  }
}

interface Question {
  id: string
  quizId: string
  question: string
  options: string
  correctAnswer: string
  points: number
  order: number
}

interface Session {
  id: string
  name: string
  status: string
}

interface AdminQuizManagerProps {
  userRole: string
}

export default function AdminQuizManager({ userRole }: AdminQuizManagerProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedQuiz, setSelectedQuiz] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showQuizForm, setShowQuizForm] = useState(false)
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    timeLimit: 600,
    passingScoreNormal: 80,
    passingScoreToWatch: 90
  })
  const [questionData, setQuestionData] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    points: 1
  })

  useEffect(() => {
    fetchQuizzes()
  }, [])

  useEffect(() => {
    if (selectedQuiz) {
      fetchQuestions()
    }
  }, [selectedQuiz])

  const fetchQuizzes = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/quiz')
      if (response.ok) {
        const data = await response.json()
        setQuizzes(data)
      } else {
        setError('Erreur lors du chargement des quiz')
      }
    } catch (error) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const fetchQuestions = async () => {
    if (!selectedQuiz) return
    
    try {
      const response = await fetch(`/api/quiz/${selectedQuiz}/questions`)
      if (response.ok) {
        const data = await response.json()
        setQuestions(data)
      } else {
        setError('Erreur lors du chargement des questions')
      }
    } catch (error) {
      setError('Erreur de connexion')
    }
  }

  const createQuiz = async () => {
    if (!quizData.title.trim()) {
      setError('Le titre du quiz est requis')
      return
    }

    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(quizData)
      })

      if (response.ok) {
        setQuizData({
          title: '',
          description: '',
          timeLimit: 600,
          passingScoreNormal: 80,
          passingScoreToWatch: 90
        })
        setShowQuizForm(false)
        fetchQuizzes()
        setError('')
      } else {
        setError('Erreur lors de la création du quiz')
      }
    } catch (error) {
      setError('Erreur de connexion')
    }
  }

  const createQuestion = async () => {
    if (!questionData.question.trim() || !questionData.correctAnswer) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      const response = await fetch(`/api/quiz/${selectedQuiz}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...questionData,
          options: JSON.stringify(questionData.options.filter(opt => opt.trim())),
          order: questions.length + 1
        })
      })

      if (response.ok) {
        setQuestionData({
          question: '',
          options: ['', '', '', ''],
          correctAnswer: '',
          points: 1
        })
        setShowQuestionForm(false)
        fetchQuestions()
        setError('')
      } else {
        setError('Erreur lors de la création de la question')
      }
    } catch (error) {
      setError('Erreur de connexion')
    }
  }

  const canManageQuizzes = ['SUPERVISEUR', 'DIRECTEUR'].includes(userRole)

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: '24px',
      border: '1px solid rgba(148, 163, 184, 0.1)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#f8fafc',
          margin: 0
        }}>
          Configuration des Questionnaires
        </h2>
        {canManageQuizzes && (
          <button
            onClick={() => setShowQuizForm(true)}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            + Nouveau Quiz
          </button>
        )}
      </div>

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

      {showQuizForm && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid rgba(148, 163, 184, 0.2)'
        }}>
          <h3 style={{ color: '#f8fafc', marginBottom: '16px' }}>Créer un nouveau quiz</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px' }}>
                Titre *
              </label>
              <input
                type="text"
                value={quizData.title}
                onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#f8fafc',
                  fontSize: '14px'
                }}
                placeholder="Nom du questionnaire"
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px' }}>
                Temps limite (secondes)
              </label>
              <input
                type="number"
                value={quizData.timeLimit}
                onChange={(e) => setQuizData({ ...quizData, timeLimit: parseInt(e.target.value) || 600 })}
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#f8fafc',
                  fontSize: '14px'
                }}
                min="60"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px' }}>
                Note minimale (candidats normaux) %
              </label>
              <input
                type="number"
                value={quizData.passingScoreNormal}
                onChange={(e) => setQuizData({ ...quizData, passingScoreNormal: parseInt(e.target.value) || 80 })}
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#f8fafc',
                  fontSize: '14px'
                }}
                min="0"
                max="100"
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px' }}>
                Note minimale (candidats à surveiller) %
              </label>
              <input
                type="number"
                value={quizData.passingScoreToWatch}
                onChange={(e) => setQuizData({ ...quizData, passingScoreToWatch: parseInt(e.target.value) || 90 })}
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#f8fafc',
                  fontSize: '14px'
                }}
                min="0"
                max="100"
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px' }}>
              Description
            </label>
            <textarea
              value={quizData.description}
              onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
              style={{
                width: '100%',
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                color: '#f8fafc',
                fontSize: '14px',
                minHeight: '80px',
                resize: 'vertical'
              }}
              placeholder="Description du questionnaire..."
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={createQuiz}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Créer
            </button>
            <button
              onClick={() => {
                setShowQuizForm(false)
                setError('')
              }}
              style={{
                background: 'rgba(75, 85, 99, 0.5)',
                color: '#d1d5db',
                border: '1px solid rgba(107, 114, 128, 0.3)',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div>
          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#94a3b8', 
              padding: '40px' 
            }}>
              Chargement des questionnaires...
            </div>
          ) : quizzes.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#94a3b8', 
              padding: '40px',
              fontStyle: 'italic'
            }}>
              Aucun questionnaire trouvé pour cette session
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid rgba(148, 163, 184, 0.2)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div>
                      <h3 style={{
                        color: '#f8fafc',
                        fontSize: '18px',
                        fontWeight: '600',
                        margin: '0 0 4px 0'
                      }}>
                        {quiz.title}
                      </h3>
                      {quiz.description && (
                        <p style={{
                          color: '#94a3b8',
                          fontSize: '14px',
                          margin: '0 0 8px 0'
                        }}>
                          {quiz.description}
                        </p>
                      )}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        fontSize: '14px',
                        color: '#cbd5e1'
                      }}>
                        <span>❓ {quiz._count.questions} questions</span>
                        <span>📝 {quiz._count.attempts} tentatives</span>
                        <span>⏱️ {Math.floor(quiz.timeLimit / 60)}min</span>
                        <span>📊 {quiz.passingScoreNormal}%/{quiz.passingScoreToWatch}%</span>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      {canManageQuizzes && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => setSelectedQuiz(quiz.id)}
                            style={{
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Questions
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {selectedQuiz && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(148, 163, 184, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ color: '#f8fafc', margin: 0 }}>
              Questions - {quizzes.find(q => q.id === selectedQuiz)?.title}
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              {canManageQuizzes && (
                <button
                  onClick={() => setShowQuestionForm(true)}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  + Ajouter Question
                </button>
              )}
              <button
                onClick={() => setSelectedQuiz('')}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Fermer
              </button>
            </div>
          </div>

          {showQuestionForm && (
            <div style={{
              background: 'rgba(30, 41, 59, 0.6)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h4 style={{ color: '#f8fafc', marginBottom: '12px' }}>Nouvelle question</h4>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '6px' }}>
                  Question *
                </label>
                <textarea
                  value={questionData.question}
                  onChange={(e) => setQuestionData({ ...questionData, question: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    borderRadius: '6px',
                    padding: '8px',
                    color: '#f8fafc',
                    fontSize: '14px',
                    minHeight: '60px'
                  }}
                  placeholder="Tapez votre question ici..."
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '6px' }}>
                  Options de réponse
                </label>
                {questionData.options.map((option, index) => (
                  <input
                    key={index}
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...questionData.options]
                      newOptions[index] = e.target.value
                      setQuestionData({ ...questionData, options: newOptions })
                    }}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      borderRadius: '6px',
                      padding: '8px',
                      color: '#f8fafc',
                      fontSize: '14px',
                      marginBottom: '6px'
                    }}
                    placeholder={`Option ${index + 1}`}
                  />
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '6px' }}>
                    Réponse correcte *
                  </label>
                  <input
                    type="text"
                    value={questionData.correctAnswer}
                    onChange={(e) => setQuestionData({ ...questionData, correctAnswer: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      borderRadius: '6px',
                      padding: '8px',
                      color: '#f8fafc',
                      fontSize: '14px'
                    }}
                    placeholder="Réponse exacte"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '6px' }}>
                    Points
                  </label>
                  <input
                    type="number"
                    value={questionData.points}
                    onChange={(e) => setQuestionData({ ...questionData, points: parseInt(e.target.value) || 1 })}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      borderRadius: '6px',
                      padding: '8px',
                      color: '#f8fafc',
                      fontSize: '14px'
                    }}
                    min="1"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={createQuestion}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Ajouter
                </button>
                <button
                  onClick={() => {
                    setShowQuestionForm(false)
                    setQuestionData({
                      question: '',
                      options: ['', '', '', ''],
                      correctAnswer: '',
                      points: 1
                    })
                  }}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gap: '12px' }}>
            {questions.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#94a3b8', 
                padding: '20px',
                fontStyle: 'italic'
              }}>
                Aucune question trouvée
              </div>
            ) : (
              questions.map((question, index) => (
                <div
                  key={question.id}
                  style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    borderRadius: '8px',
                    padding: '12px',
                    border: '1px solid rgba(148, 163, 184, 0.1)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h5 style={{
                        color: '#f8fafc',
                        fontSize: '14px',
                        fontWeight: '600',
                        margin: '0 0 8px 0'
                      }}>
                        {index + 1}. {question.question}
                      </h5>
                      <div style={{
                        color: '#94a3b8',
                        fontSize: '12px',
                        marginBottom: '4px'
                      }}>
                        Options: {JSON.parse(question.options).join(', ')}
                      </div>
                      <div style={{
                        color: '#10b981',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        Réponse: {question.correctAnswer} ({question.points} pts)
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
