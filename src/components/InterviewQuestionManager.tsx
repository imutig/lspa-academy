'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface InterviewQuestion {
  id: string
  question: string
  category: string
}

export default function InterviewQuestionManager() {
  const { data: session } = useSession()
  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<InterviewQuestion | null>(null)
  const [formData, setFormData] = useState({
    question: '',
    category: 'motivation'
  })

  const categories = [
    { id: 'motivation', label: 'Motivation' },
    { id: 'personnalite', label: 'Personnalité' },
    { id: 'competences', label: 'Compétences' },
    { id: 'relationnel', label: 'Relationnel' },
    { id: 'technique', label: 'Technique' }
  ]

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/interview-questions')
      if (response.ok) {
        const data = await response.json()
        setQuestions(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.question) {
      alert('Veuillez remplir la question')
      return
    }

    try {
      let url = '/api/interview-questions'
      const method = editingQuestion ? 'PUT' : 'POST'
      
      if (editingQuestion) {
        url = `/api/interview-questions/${editingQuestion.id}`
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchQuestions()
        setShowForm(false)
        setEditingQuestion(null)
        setFormData({
          question: '',
          category: 'motivation'
        })
      } else {
        alert('Erreur lors de l\'enregistrement')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'enregistrement')
    }
  }

  const handleEdit = (question: InterviewQuestion) => {
    setEditingQuestion(question)
    setFormData({
      question: question.question,
      category: question.category
    })
    setShowForm(true)
  }

  const handleDelete = async (questionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
      return
    }

    try {
      const response = await fetch(`/api/interview-questions/${questionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchQuestions()
      } else {
        alert('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression')
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(59, 130, 246, 0.3)',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    )
  }

  return (
    <div style={{
      background: 'rgba(17, 24, 39, 0.7)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(75, 85, 99, 0.3)',
      borderRadius: '16px',
      padding: '24px'
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
          color: 'white',
          margin: 0
        }}>
          Questions d'Entretien
        </h2>
        
        {['DIRECTEUR', 'SUPERVISEUR'].includes(session?.user?.role || '') && (
          <button
            onClick={() => {
              setEditingQuestion(null)
              setFormData({
                question: '',
                category: 'motivation'
              })
              setShowForm(true)
            }}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>➕</span>
            <span>Ajouter une Question</span>
          </button>
        )}
      </div>

      {/* Liste des questions */}
      <div style={{
        display: 'grid',
        gap: '16px'
      }}>
        {questions.map((question) => (
          <div
            key={question.id}
            style={{
              background: 'rgba(31, 41, 55, 0.6)',
              border: '1px solid rgba(75, 85, 99, 0.3)',
              borderRadius: '12px',
              padding: '20px'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px'
                }}>
                  <span style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#3b82f6',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {categories.find(c => c.id === question.category)?.label || question.category}
                  </span>
                </div>
                
                <h3 style={{
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: 0,
                  marginBottom: '12px'
                }}>
                  {question.question}
                </h3>
                
                <div>
                </div>
              </div>
              
              {['DIRECTEUR', 'SUPERVISEUR'].includes(session?.user?.role || '') && (
                <div style={{
                  display: 'flex',
                  gap: '8px'
                }}>
                  <button
                    onClick={() => handleEdit(question)}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(168, 85, 247, 0.2)',
                      border: '1px solid rgba(168, 85, 247, 0.5)',
                      borderRadius: '6px',
                      color: '#a855f7',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(question.id)}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.5)',
                      borderRadius: '6px',
                      color: '#ef4444',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de formulaire */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '600px',
            maxHeight: '80vh',
            background: 'rgba(17, 24, 39, 0.95)',
            borderRadius: '16px',
            padding: '32px',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(75, 85, 99, 0.3)',
            overflow: 'auto'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '24px'
            }}>
              {editingQuestion ? 'Modifier la Question' : 'Nouvelle Question'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '500',
                  marginBottom: '8px'
                }}>
                  Question :
                </label>
                <textarea
                  value={formData.question}
                  onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="Saisissez votre question..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(31, 41, 55, 0.8)',
                    border: '1px solid rgba(75, 85, 99, 0.5)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '16px',
                    resize: 'vertical'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '500',
                  marginBottom: '8px'
                }}>
                  Catégorie :
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(31, 41, 55, 0.8)',
                    border: '1px solid rgba(75, 85, 99, 0.5)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '16px'
                  }}
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingQuestion(null)
                  }}
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(75, 85, 99, 0.5)',
                    border: '1px solid rgba(75, 85, 99, 0.7)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {editingQuestion ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
