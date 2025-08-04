'use client'

import { useState, useEffect } from 'react'

interface Candidate {
  id: string
  username: string
  email: string
  matricule?: string
  createdAt: string
}

export default function MatriculeManager() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMatricule, setEditingMatricule] = useState<string | null>(null)
  const [matriculeInput, setMatriculeInput] = useState('')

  useEffect(() => {
    fetchCandidates()
  }, [])

  const fetchCandidates = async () => {
    try {
      const response = await fetch('/api/admin/matricules')
      const data = await response.json()
      
      if (response.ok) {
        setCandidates(data.candidates)
      } else {
        console.error('Erreur:', data.error)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des candidats:', error)
    } finally {
      setLoading(false)
    }
  }

  const assignMatricule = async (candidateId: string, matricule: string) => {
    if (!matricule.trim()) {
      alert('Veuillez saisir un matricule')
      return
    }

    try {
      const response = await fetch('/api/admin/matricules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: candidateId, matricule: matricule.trim() })
      })

      const data = await response.json()
      
      if (response.ok) {
        setCandidates(candidates.map(candidate => 
          candidate.id === candidateId ? data.user : candidate
        ))
        setEditingMatricule(null)
        setMatriculeInput('')
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('Erreur lors de l\'attribution du matricule:', error)
      alert('Erreur lors de l\'attribution du matricule')
    }
  }

  const startEditing = (candidateId: string, currentMatricule?: string) => {
    setEditingMatricule(candidateId)
    setMatriculeInput(currentMatricule || '')
  }

  const cancelEditing = () => {
    setEditingMatricule(null)
    setMatriculeInput('')
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
        <p style={{color: 'white'}}>Chargement des candidats...</p>
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
      <h2 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: 'white',
        marginBottom: '24px'
      }}>Attribution des Matricules</h2>

      <div style={{
        display: 'grid',
        gap: '16px'
      }}>
        {candidates.map((candidate) => (
          <div
            key={candidate.id}
            style={{
              background: 'rgba(31, 41, 55, 0.5)',
              border: '1px solid rgba(75, 85, 99, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}
          >
            <div style={{flex: '1'}}>
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
                }}>{candidate.username}</h3>
                {candidate.matricule ? (
                  <span style={{
                    background: 'rgba(34, 197, 94, 0.2)',
                    color: '#4ade80',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    #{candidate.matricule}
                  </span>
                ) : (
                  <span style={{
                    background: 'rgba(234, 179, 8, 0.2)',
                    color: '#facc15',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    Non attribué
                  </span>
                )}
              </div>
              <p style={{
                color: '#9ca3af',
                fontSize: '14px',
                margin: '0 0 4px 0'
              }}>{candidate.email}</p>
              <p style={{
                color: '#6b7280',
                fontSize: '12px',
                margin: 0
              }}>
                Inscrit le {new Date(candidate.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {editingMatricule === candidate.id ? (
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  <input
                    type="text"
                    value={matriculeInput}
                    onChange={(e) => setMatriculeInput(e.target.value)}
                    placeholder="Ex: 2025001"
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(31, 41, 55, 0.8)',
                      border: '1px solid rgba(75, 85, 99, 0.5)',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '14px',
                      width: '120px'
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        assignMatricule(candidate.id, matriculeInput)
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => assignMatricule(candidate.id, matriculeInput)}
                    style={{
                      padding: '8px 12px',
                      background: '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.background = '#16a34a'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.background = '#22c55e'}
                  >
                    Valider
                  </button>
                  <button
                    onClick={cancelEditing}
                    style={{
                      padding: '8px 12px',
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startEditing(candidate.id, candidate.matricule)}
                  style={{
                    padding: '8px 12px',
                    background: candidate.matricule 
                      ? 'rgba(147, 51, 234, 0.2)' 
                      : 'rgba(59, 130, 246, 0.2)',
                    color: candidate.matricule ? '#a855f7' : '#60a5fa',
                    border: `1px solid ${candidate.matricule 
                      ? 'rgba(147, 51, 234, 0.3)' 
                      : 'rgba(59, 130, 246, 0.3)'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    const isAssigned = candidate.matricule
                    ;(e.target as HTMLElement).style.background = isAssigned 
                      ? 'rgba(147, 51, 234, 0.3)' 
                      : 'rgba(59, 130, 246, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    const isAssigned = candidate.matricule
                    ;(e.target as HTMLElement).style.background = isAssigned 
                      ? 'rgba(147, 51, 234, 0.2)' 
                      : 'rgba(59, 130, 246, 0.2)'
                  }}
                >
                  {candidate.matricule ? 'Modifier' : 'Attribuer'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {candidates.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px 0',
          color: '#9ca3af'
        }}>
          <p>Aucun candidat trouvé</p>
        </div>
      )}
    </div>
  )
}
