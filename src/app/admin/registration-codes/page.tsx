'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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

const styles = {
  page: {
    background: 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #111827 100%)',
    minHeight: '100vh',
    color: 'white',
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  container: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '32px 24px'
  },
  glassCard: {
    background: 'rgba(31, 41, 55, 0.6)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(75, 85, 99, 0.3)',
    borderRadius: '16px',
    transition: 'all 0.3s ease'
  },
  input: {
    background: 'rgba(55, 65, 81, 0.6)',
    border: '1px solid rgba(75, 85, 99, 0.5)',
    borderRadius: '8px',
    color: 'white',
    padding: '8px 12px',
    transition: 'all 0.3s ease',
    outline: 'none'
  },
  button: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontWeight: '600',
    padding: '8px 16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  dangerButton: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontWeight: '600',
    padding: '8px 16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  }
}

export default function RegistrationCodesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [codes, setCodes] = useState<RegistrationCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (session && !['DIRECTEUR', 'SUPERVISEUR'].includes((session.user as any)?.role)) {
      router.push('/admin/dashboard')
      return
    }
    fetchCodes()
  }, [session])

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
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid rgba(59, 130, 246, 0.3)',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            margin: '0 auto 32px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ fontSize: '24px', fontWeight: '600' }}>Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Link
            href="/admin/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              color: '#60a5fa',
              textDecoration: 'none',
              marginBottom: '16px',
              transition: 'color 0.3s ease'
            }}
          >
            <svg style={{ width: '16px', height: '16px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour au tableau de bord
          </Link>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: 0 }}>
                Codes d'inscription
              </h1>
              <p style={{ color: '#9ca3af', fontSize: '18px', margin: '8px 0 0 0' }}>
                Gérez les codes d'inscription pour les nouveaux candidats
              </p>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                ...styles.button,
                padding: '12px 24px',
                fontSize: '16px'
              }}
            >
              + Nouveau code
            </button>
          </div>
        </div>

        {/* Codes list */}
        <div style={styles.glassCard}>
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(75, 85, 99, 0.3)' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
              Codes actifs ({codes.filter(c => c.isActive).length})
            </h2>
          </div>
          
          {codes.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', color: '#6b7280', marginBottom: '16px' }}>🔑</div>
              <p style={{ color: '#9ca3af', fontSize: '18px', margin: 0 }}>Aucun code d'inscription</p>
            </div>
          ) : (
            <div style={{ padding: '24px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '20px'
              }}>
                {codes.map((code) => (
                  <div key={code.id} style={{
                    background: 'rgba(55, 65, 81, 0.4)',
                    border: '1px solid rgba(75, 85, 99, 0.4)',
                    borderRadius: '12px',
                    padding: '20px',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{
                          fontSize: '20px',
                          fontWeight: '600',
                          color: 'white',
                          margin: '0 0 8px 0',
                          fontFamily: 'monospace'
                        }}>
                          {code.code}
                        </h3>
                        {code.description && (
                          <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
                            {code.description}
                          </p>
                        )}
                      </div>
                      
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: code.isActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: code.isActive ? '#22c55e' : '#ef4444',
                        border: `1px solid ${code.isActive ? '#22c55e40' : '#ef444440'}`
                      }}>
                        {code.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 4px 0' }}>
                          Utilisations
                        </p>
                        <p style={{ fontSize: '16px', fontWeight: '600', color: 'white', margin: 0 }}>
                          {code.usedCount} / {code.usageLimit || '∞'}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 4px 0' }}>
                          Créé le
                        </p>
                        <p style={{ fontSize: '14px', color: 'white', margin: 0 }}>
                          {new Date(code.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => toggleCodeStatus(code.id, code.isActive)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: code.isActive ? 'rgba(239, 68, 68, 0.6)' : 'rgba(34, 197, 94, 0.6)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        {code.isActive ? 'Désactiver' : 'Activer'}
                      </button>
                      <button
                        onClick={() => deleteCode(code.id)}
                        style={{
                          ...styles.dangerButton,
                          fontSize: '12px',
                          padding: '8px 12px'
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal de création */}
        {showCreateModal && (
          <CreateCodeModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false)
              fetchCodes()
            }}
          />
        )}
      </div>
    </div>
  )
}

// Modal de création de code
interface CreateCodeModalProps {
  onClose: () => void
  onSuccess: () => void
}

function CreateCodeModal({ onClose, onSuccess }: CreateCodeModalProps) {
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
        borderRadius: '20px',
        padding: '32px',
        width: '100%',
        maxWidth: '500px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
      }}>
        <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', margin: '0 0 24px 0' }}>
          Créer un nouveau code
        </h3>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#fca5a5',
            padding: '12px 16px',
            fontSize: '14px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#d1d5db', marginBottom: '8px' }}>
              Code d'inscription
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="CODE_INSCRIPTION"
                required
                style={{
                  ...styles.input,
                  flex: 1,
                  padding: '12px 16px',
                  textTransform: 'uppercase',
                  fontFamily: 'monospace'
                }}
              />
              <button
                type="button"
                onClick={generateRandomCode}
                style={{
                  ...styles.button,
                  padding: '12px 16px',
                  whiteSpace: 'nowrap'
                }}
              >
                Générer
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#d1d5db', marginBottom: '8px' }}>
              Description (optionnel)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description du code..."
              style={{
                ...styles.input,
                width: '100%',
                padding: '12px 16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#d1d5db', marginBottom: '8px' }}>
              Limite d'utilisation (optionnel)
            </label>
            <input
              type="number"
              value={formData.usageLimit}
              onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: e.target.value }))}
              placeholder="Nombre max d'utilisations (vide = illimité)"
              min="1"
              style={{
                ...styles.input,
                width: '100%',
                padding: '12px 16px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px 24px',
                background: 'rgba(75, 85, 99, 0.6)',
                color: 'white',
                border: '1px solid rgba(107, 114, 128, 0.5)',
                borderRadius: '12px',
                fontWeight: '500',
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
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '600',
                cursor: (loading || !formData.code) ? 'not-allowed' : 'pointer',
                opacity: (loading || !formData.code) ? 0.7 : 1
              }}
            >
              {loading ? 'Création...' : 'Créer le code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
