'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'

const styles = {
  page: {
    background: 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #111827 100%)',
    minHeight: '100vh',
    color: 'white',
    fontFamily: 'Inter, system-ui, sans-serif',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  container: {
    width: '100%',
    maxWidth: '450px'
  },
  glassCard: {
    background: 'rgba(31, 41, 55, 0.8)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(75, 85, 99, 0.3)',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)'
  },
  logo: {
    textAlign: 'center' as const,
    marginBottom: '32px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    marginBottom: '8px',
    background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  subtitle: {
    fontSize: '16px',
    color: '#9ca3af',
    textAlign: 'center' as const,
    marginBottom: '32px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#d1d5db'
  },
  input: {
    background: 'rgba(55, 65, 81, 0.6)',
    border: '1px solid rgba(75, 85, 99, 0.5)',
    borderRadius: '12px',
    color: 'white',
    padding: '14px 16px',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    outline: 'none'
  },
  button: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    fontWeight: '600',
    padding: '14px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
  },
  secondaryButton: {
    background: 'rgba(75, 85, 99, 0.6)',
    border: '1px solid rgba(107, 114, 128, 0.5)',
    borderRadius: '12px',
    color: 'white',
    fontWeight: '500',
    padding: '14px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  error: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    color: '#fca5a5',
    padding: '12px 16px',
    fontSize: '14px',
    textAlign: 'center' as const
  },
  success: {
    background: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    borderRadius: '8px',
    color: '#86efac',
    padding: '12px 16px',
    fontSize: '14px',
    textAlign: 'center' as const
  },
  footerLinks: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid rgba(75, 85, 99, 0.3)'
  }
}

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    code: '',
    username: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Générer automatiquement un nom d'utilisateur basé sur prénom + nom
  useEffect(() => {
    if (formData.firstName && formData.lastName) {
      const username = `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}`
        .replace(/[^a-z0-9.]/g, '') // Supprimer les caractères spéciaux
      setFormData(prev => ({ ...prev, username }))
    }
  }, [formData.firstName, formData.lastName])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.code.trim() || !formData.password.trim() || !formData.confirmPassword.trim()) {
      setError('Tous les champs sont requis')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // 1. Vérifier et valider le code d'inscription
      const codeResponse = await fetch('/api/registration-codes/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: formData.code })
      })

      if (!codeResponse.ok) {
        const errorData = await codeResponse.json()
        throw new Error(errorData.error || 'Code d\'inscription invalide')
      }

      // 2. Créer le compte utilisateur
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          username: formData.username,
          password: formData.password,
          code: formData.code.trim()
        })
      })

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json()
        throw new Error(errorData.error || 'Erreur lors de la création du compte')
      }

      setSuccess('Compte créé avec succès ! Redirection vers la connexion...')
      
      // Redirection vers la page de connexion après 2 secondes
      setTimeout(() => {
        router.push('/login')
      }, 2000)

    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error)
      setError(error instanceof Error ? error.message : 'Une erreur inattendue s\'est produite')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.glassCard}>
          {/* Logo */}
          <div style={styles.logo}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎓</div>
          </div>

          {/* Titre */}
          <h1 style={styles.title}>Inscription</h1>
          <p style={styles.subtitle}>
            Créez votre compte avec votre code d'inscription
          </p>

          {/* Messages */}
          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label htmlFor="firstName" style={styles.label}>
                Prénom *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Votre prénom"
                required
                disabled={loading}
                style={{
                  ...styles.input,
                  opacity: loading ? 0.7 : 1
                }}
              />
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="lastName" style={styles.label}>
                Nom *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Votre nom de famille"
                required
                disabled={loading}
                style={{
                  ...styles.input,
                  opacity: loading ? 0.7 : 1
                }}
              />
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="username" style={styles.label}>
                Nom d'utilisateur (généré automatiquement)
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Sera généré automatiquement"
                disabled={loading}
                style={{
                  ...styles.input,
                  opacity: 0.7,
                  background: 'rgba(55, 65, 81, 0.3)'
                }}
              />
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="password" style={styles.label}>
                Mot de passe *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Choisissez un mot de passe"
                required
                disabled={loading}
                style={{
                  ...styles.input,
                  opacity: loading ? 0.7 : 1
                }}
              />
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="confirmPassword" style={styles.label}>
                Confirmer le mot de passe *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirmez votre mot de passe"
                required
                disabled={loading}
                style={{
                  ...styles.input,
                  opacity: loading ? 0.7 : 1
                }}
              />
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="code" style={styles.label}>
                Code d'inscription *
              </label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="Votre code d'inscription"
                required
                disabled={loading}
                style={{
                  ...styles.input,
                  opacity: loading ? 0.7 : 1,
                  textTransform: 'uppercase'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !formData.firstName || !formData.lastName || !formData.code || !formData.password || !formData.confirmPassword}
              style={{
                ...styles.button,
                opacity: (loading || !formData.firstName || !formData.lastName || !formData.code || !formData.password || !formData.confirmPassword) ? 0.5 : 1,
                cursor: (loading || !formData.firstName || !formData.lastName || !formData.code || !formData.password || !formData.confirmPassword) ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Création du compte...
                </span>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>

          {/* Liens */}
          <div style={styles.footerLinks}>
            <Link 
              href="/login" 
              style={{ 
                color: '#60a5fa', 
                textDecoration: 'none',
                fontSize: '14px',
                transition: 'color 0.3s ease'
              }}
            >
              Déjà un compte ? Se connecter
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
