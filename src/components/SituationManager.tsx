'use client'

import { useState, useEffect } from 'react'

interface Situation {
  id: string
  title: string
  description: string
  expectedResponse?: string
  difficulty: 'FACILE' | 'MOYEN' | 'DIFFICILE'
  category?: string
  createdAt: string
}

export default function SituationManager() {
  const [situations, setSituations] = useState<Situation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(() => {
    // Persistance de l'état du formulaire de création dans sessionStorage
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('situation-create-form-open') === 'true'
    }
    return false
  })
  const [editingSituation, setEditingSituation] = useState<Situation | null>(null)
  const [formData, setFormData] = useState(() => {
    // Charger les données sauvegardées depuis sessionStorage
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('situation-create-form-data')
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
      expectedResponse: '',
      difficulty: 'MOYEN' as 'FACILE' | 'MOYEN' | 'DIFFICILE',
      category: ''
    }
  })

  useEffect(() => {
    fetchSituations()
  }, [])

  // Helper pour gérer la persistance de l'état du formulaire de création
  const setShowFormPersistent = (show: boolean) => {
    setShowForm(show)
    if (typeof window !== 'undefined') {
      if (show) {
        sessionStorage.setItem('situation-create-form-open', 'true')
      } else {
        sessionStorage.removeItem('situation-create-form-open')
        sessionStorage.removeItem('situation-create-form-data') // Nettoyer les données aussi
      }
    }
  }

  // Helper pour sauvegarder automatiquement les données du formulaire
  const setFormDataPersistent = (data: any) => {
    setFormData(data)
    if (typeof window !== 'undefined' && showForm) {
      sessionStorage.setItem('situation-create-form-data', JSON.stringify(data))
    }
  }

  // Sauvegarder automatiquement quand formData change et que le formulaire est ouvert
  useEffect(() => {
    if (typeof window !== 'undefined' && showForm && (formData.title || formData.description)) {
      sessionStorage.setItem('situation-create-form-data', JSON.stringify(formData))
    }
  }, [formData, showForm])

  const fetchSituations = async () => {
    try {
      const response = await fetch('/api/admin/situations')
      const data = await response.json()
      
      if (response.ok) {
        setSituations(data.situations)
      } else {
        console.error('Erreur:', data.error)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des situations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Veuillez remplir au minimum le titre et la description')
      return
    }

    try {
      const url = editingSituation ? `/api/admin/situations/${editingSituation.id}` : '/api/admin/situations'
      const method = editingSituation ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      
      if (response.ok) {
        if (editingSituation) {
          setSituations(situations.map(s => s.id === editingSituation.id ? data.situation : s))
        } else {
          setSituations([data.situation, ...situations])
        }
        resetForm()
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  const deleteSituation = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette situation ?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/situations/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSituations(situations.filter(s => s.id !== id))
      } else {
        const data = await response.json()
        alert(data.error)
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const startEditing = (situation: Situation) => {
    setEditingSituation(situation)
    setFormData({
      title: situation.title,
      description: situation.description,
      expectedResponse: situation.expectedResponse || '',
      difficulty: situation.difficulty,
      category: situation.category || ''
    })
    setShowFormPersistent(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      expectedResponse: '',
      difficulty: 'MOYEN',
      category: ''
    })
    setEditingSituation(null)
    setShowFormPersistent(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const newData = {
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }
    setFormDataPersistent(newData)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'FACILE': return '#22c55e'
      case 'MOYEN': return '#f59e0b'
      case 'DIFFICILE': return '#ef4444'
      default: return '#6b7280'
    }
  }

  if (loading) {
    return (
      <div style={{
        background: 'rgba(17, 24, 39, 0.7)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(75, 85, 99, 0.3)',
        borderRadius: '16px',
        padding: '32px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(59, 130, 246, 0.3)',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px auto'
        }}></div>
        <p style={{color: 'white'}}>Chargement des situations...</p>
      </div>
    )
  }

  return (
    <div style={{
      background: 'rgba(17, 24, 39, 0.7)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(75, 85, 99, 0.3)',
      borderRadius: '16px',
      padding: '32px'
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
        }}>Gestion des Mises en Situation</h2>
        
        <button
          onClick={() => setShowFormPersistent(!showForm)}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {showForm ? 'Annuler' : '+ Nouvelle Situation'}
        </button>
      </div>

      {showForm && (
        <div style={{
          background: 'rgba(31, 41, 55, 0.6)',
          border: '1px solid rgba(75, 85, 99, 0.3)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h3 style={{
            color: 'white',
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '20px'
          }}>
            {editingSituation ? 'Modifier la situation' : 'Nouvelle situation'}
          </h3>

          <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
              <div>
                <label style={{color: '#d1d5db', fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block'}}>
                  Titre *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(55, 65, 81, 0.8)',
                    border: '1px solid rgba(75, 85, 99, 0.5)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{color: '#d1d5db', fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block'}}>
                  Catégorie
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="ex: Intervention, Investigation..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(55, 65, 81, 0.8)',
                    border: '1px solid rgba(75, 85, 99, 0.5)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
              <div>
                <label style={{color: '#d1d5db', fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block'}}>
                  Difficulté
                </label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(55, 65, 81, 0.8)',
                    border: '1px solid rgba(75, 85, 99, 0.5)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                >
                  <option value="FACILE">Facile</option>
                  <option value="MOYEN">Moyen</option>
                  <option value="DIFFICILE">Difficile</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{color: '#d1d5db', fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block'}}>
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(55, 65, 81, 0.8)',
                  border: '1px solid rgba(75, 85, 99, 0.5)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div>
              <label style={{color: '#d1d5db', fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block'}}>
                Réponse attendue
              </label>
              <textarea
                name="expectedResponse"
                value={formData.expectedResponse}
                onChange={handleInputChange}
                rows={4}
                placeholder="Décrivez la réponse ou le comportement attendu du candidat..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(55, 65, 81, 0.8)',
                  border: '1px solid rgba(75, 85, 99, 0.5)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(75, 85, 99, 0.6)',
                  border: '1px solid rgba(107, 114, 128, 0.5)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {editingSituation ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{
        display: 'grid',
        gap: '16px'
      }}>
        {situations.map((situation) => (
          <div
            key={situation.id}
            style={{
              background: 'rgba(31, 41, 55, 0.5)',
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
              <div style={{flex: 1}}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px'
                }}>
                  <h3 style={{
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: 0
                  }}>{situation.title}</h3>
                  
                  <span style={{
                    background: `${getDifficultyColor(situation.difficulty)}20`,
                    color: getDifficultyColor(situation.difficulty),
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {situation.difficulty}
                  </span>

                  {situation.category && (
                    <span style={{
                      background: 'rgba(59, 130, 246, 0.2)',
                      color: '#60a5fa',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {situation.category}
                    </span>
                  )}


                </div>
                
                <p style={{
                  color: '#d1d5db',
                  fontSize: '14px',
                  margin: '0 0 8px 0',
                  lineHeight: 1.5
                }}>{situation.description}</p>
                
                <p style={{
                  color: '#9ca3af',
                  fontSize: '12px',
                  margin: 0
                }}>
                  Créé le {new Date(situation.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>

              <div style={{
                display: 'flex',
                gap: '8px',
                marginLeft: '16px'
              }}>
                <button
                  onClick={() => startEditing(situation)}
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(147, 51, 234, 0.2)',
                    color: '#a855f7',
                    border: '1px solid rgba(147, 51, 234, 0.3)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Modifier
                </button>
                <button
                  onClick={() => deleteSituation(situation.id)}
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Supprimer
                </button>
              </div>
            </div>

            {situation.expectedResponse && (
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                borderRadius: '8px',
                padding: '12px',
                marginTop: '8px'
              }}>
                <h4 style={{
                  color: '#86efac',
                  fontSize: '14px',
                  fontWeight: '500',
                  margin: '0 0 8px 0'
                }}>Réponse attendue:</h4>
                <p style={{
                  color: '#d1fae5',
                  fontSize: '13px',
                  margin: 0,
                  lineHeight: 1.4,
                  whiteSpace: 'pre-wrap'
                }}>{situation.expectedResponse}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {situations.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px 0',
          color: '#9ca3af'
        }}>
          <p>Aucune situation trouvée</p>
          <p style={{fontSize: '14px', marginTop: '8px'}}>
            Créez votre première mise en situation pour enrichir les entretiens.
          </p>
        </div>
      )}
    </div>
  )
}
