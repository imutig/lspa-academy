'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface RegistrationCode {
  id: string
  code: string
  description: string | null
  usageLimit: number | null
  usedCount: number
  isActive: boolean
  createdAt: string
}

interface RegistrationCodesManagerProps {
  userRole: string
}

export default function RegistrationCodesManager({ userRole }: RegistrationCodesManagerProps) {
  const [codes, setCodes] = useState<RegistrationCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchCodes()
  }, [])

  const fetchCodes = async () => {
    try {
      const response = await fetch('/api/registration-codes')
      if (response.ok) {
        const data = await response.json()
        setCodes(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des codes:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCodeStatus = async (codeId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/registration-codes/${codeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !isActive })
      })

      if (response.ok) {
        fetchCodes()
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du code:', error)
    }
  }

  const deleteCode = async (codeId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce code ?')) return

    try {
      const response = await fetch(`/api/registration-codes/${codeId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchCodes()
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du code:', error)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid rgba(59, 130, 246, 0.3)',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    )
  }

  if (!['DIRECTEUR', 'SUPERVISEUR'].includes(userRole)) {
    return (
      <div style={{
        background: 'rgba(17, 24, 39, 0.7)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(75, 85, 99, 0.3)',
        borderRadius: '16px',
        padding: '48px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
        <h3 style={{ color: 'white', fontSize: '20px', marginBottom: '8px' }}>
          Accès restreint
        </h3>
        <p style={{ color: '#9ca3af' }}>
          Vous n'avez pas les permissions nécessaires pour gérer les codes d'inscription.
        </p>
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
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <div>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: 'white', 
            margin: '0 0 8px 0' 
          }}>
            Codes d'inscription
          </h2>
          <p style={{ color: '#9ca3af', margin: 0 }}>
            Gérez les codes pour l'inscription des nouveaux candidats
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            href="/admin/registration-codes"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'rgba(75, 85, 99, 0.6)',
              color: 'white',
              border: '1px solid rgba(107, 114, 128, 0.5)',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
          >
            <span>📊</span>
            Gestion avancée
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
          >
            <span>+</span>
            Nouveau code
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
            {codes.filter(c => c.isActive).length}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Codes actifs</div>
        </div>
        
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
            {codes.reduce((sum, code) => sum + code.usedCount, 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Utilisations totales</div>
        </div>

        <div style={{
          background: 'rgba(168, 85, 247, 0.1)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#a855f7' }}>
            {codes.filter(c => c.usageLimit === null).length}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Codes illimités</div>
        </div>
      </div>

      {/* Liste des codes récents */}
      <div>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          color: 'white', 
          margin: '0 0 16px 0' 
        }}>
          Codes récents
        </h3>
        
        {codes.length === 0 ? (
          <div style={{
            background: 'rgba(55, 65, 81, 0.4)',
            border: '1px solid rgba(75, 85, 99, 0.4)',
            borderRadius: '8px',
            padding: '32px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', color: '#6b7280', marginBottom: '12px' }}>🔑</div>
            <p style={{ color: '#9ca3af', margin: 0 }}>Aucun code d'inscription créé</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {codes.slice(0, 5).map((code) => (
              <div key={code.id} style={{
                background: 'rgba(55, 65, 81, 0.4)',
                border: '1px solid rgba(75, 85, 99, 0.4)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: 'white',
                      fontFamily: 'monospace'
                    }}>
                      {code.code}
                    </div>
                    {code.description && (
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {code.description}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', color: 'white' }}>
                      {code.usedCount} / {code.usageLimit || '∞'}
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                      utilisations
                    </div>
                  </div>

                  <span style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: '600',
                    background: code.isActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: code.isActive ? '#22c55e' : '#ef4444',
                    border: `1px solid ${code.isActive ? '#22c55e40' : '#ef444440'}`
                  }}>
                    {code.isActive ? 'Actif' : 'Inactif'}
                  </span>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => toggleCodeStatus(code.id, code.isActive)}
                      style={{
                        padding: '4px 8px',
                        background: code.isActive ? 'rgba(239, 68, 68, 0.6)' : 'rgba(34, 197, 94, 0.6)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      {code.isActive ? 'Désactiver' : 'Activer'}
                    </button>
                    <button
                      onClick={() => deleteCode(code.id)}
                      style={{
                        padding: '4px 8px',
                        background: 'rgba(239, 68, 68, 0.6)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {codes.length > 5 && (
              <Link
                href="/admin/registration-codes"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '12px',
                  color: '#60a5fa',
                  textDecoration: 'none',
                  fontSize: '14px',
                  border: '1px solid rgba(75, 85, 99, 0.4)',
                  borderRadius: '8px',
                  background: 'rgba(55, 65, 81, 0.2)',
                  transition: 'all 0.3s ease'
                }}
              >
                Voir tous les codes ({codes.length})
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Modal de création */}
      {showCreateModal && (
        <QuickCreateCodeModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchCodes()
          }}
        />
      )}
    </div>
  )
}

// Modal de création rapide
interface QuickCreateCodeModalProps {
  onClose: () => void
  onSuccess: () => void
}

function QuickCreateCodeModal({ onClose, onSuccess }: QuickCreateCodeModalProps) {
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    usageLimit: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData(prev => ({ ...prev, code: result }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.code.trim()) {
      setError('Le code est requis')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/registration-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: formData.code.toUpperCase(),
          description: formData.description || null,
          usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null
        })
      })

      if (response.ok) {
        onSuccess()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erreur lors de la création du code')
      }
    } catch (error) {
      console.error('Erreur:', error)
      setError('Erreur lors de la création du code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        background: 'rgba(31, 41, 55, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(75, 85, 99, 0.5)',
        borderRadius: '16px',
        padding: '24px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', margin: '0 0 20px 0', color: 'white' }}>
          Créer un code rapide
        </h3>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#fca5a5',
            padding: '12px 16px',
            fontSize: '14px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="CODE_INSCRIPTION"
                required
                style={{
                  flex: 1,
                  background: 'rgba(55, 65, 81, 0.6)',
                  border: '1px solid rgba(75, 85, 99, 0.5)',
                  borderRadius: '8px',
                  color: 'white',
                  padding: '10px 12px',
                  textTransform: 'uppercase',
                  fontFamily: 'monospace',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={generateRandomCode}
                style={{
                  padding: '10px 12px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                🎲
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description (optionnel)"
              style={{
                width: '100%',
                background: 'rgba(55, 65, 81, 0.6)',
                border: '1px solid rgba(75, 85, 99, 0.5)',
                borderRadius: '8px',
                color: 'white',
                padding: '10px 12px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <input
              type="number"
              value={formData.usageLimit}
              onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: e.target.value }))}
              placeholder="Limite d'usage (vide = illimité)"
              min="1"
              style={{
                width: '100%',
                background: 'rgba(55, 65, 81, 0.6)',
                border: '1px solid rgba(75, 85, 99, 0.5)',
                borderRadius: '8px',
                color: 'white',
                padding: '10px 12px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: 'rgba(75, 85, 99, 0.6)',
                color: 'white',
                border: '1px solid rgba(107, 114, 128, 0.5)',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !formData.code}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: (loading || !formData.code) ? 'not-allowed' : 'pointer',
                opacity: (loading || !formData.code) ? 0.7 : 1
              }}
            >
              {loading ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
