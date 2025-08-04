'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
  error: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    color: '#fca5a5',
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

export default function LoginPage() {
  const router = useRouter()
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCredentials(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!credentials.username.trim() || !credentials.password.trim()) {
      setError('Nom d\'utilisateur et mot de passe requis')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        username: credentials.username,
        password: credentials.password,
        redirect: false
      })

      if (result?.error) {
        setError('Nom d\'utilisateur ou mot de passe incorrect')
      } else {
        // Obtenir les informations de session pour rediriger selon le rôle
        const session = await getSession()
        
        if (session?.user) {
          const userRole = (session.user as any).role
          
          // Redirection selon le rôle
          if (userRole === 'DIRECTEUR' || userRole === 'SUPERVISEUR') {
            router.push('/admin/dashboard')
          } else if (userRole === 'INSTRUCTEUR') {
            router.push('/instructor/dashboard')
          } else {
            router.push('/candidate/dashboard')
          }
        } else {
          // Si pas de session, rediriger vers la page d'accueil
          router.push('/')
        }
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error)
      setError('Une erreur inattendue s\'est produite')
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
          <h1 style={styles.title}>Connexion</h1>
          <p style={styles.subtitle}>
            Accédez à votre espace LSPA Academy
          </p>

          {/* Message d'erreur */}
          {error && <div style={styles.error}>{error}</div>}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label htmlFor="username" style={styles.label}>
                Nom d'utilisateur
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={credentials.username}
                onChange={handleInputChange}
                placeholder="Votre nom d'utilisateur"
                required
                disabled={loading}
                style={{
                  ...styles.input,
                  opacity: loading ? 0.7 : 1
                }}
              />
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="password" style={styles.label}>
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleInputChange}
                placeholder="Votre mot de passe"
                required
                disabled={loading}
                style={{
                  ...styles.input,
                  opacity: loading ? 0.7 : 1
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !credentials.username || !credentials.password}
              style={{
                ...styles.button,
                opacity: (loading || !credentials.username || !credentials.password) ? 0.5 : 1,
                cursor: (loading || !credentials.username || !credentials.password) ? 'not-allowed' : 'pointer'
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
                  Connexion...
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Liens */}
          <div style={styles.footerLinks}>
            <Link 
              href="/register" 
              style={{ 
                color: '#60a5fa', 
                textDecoration: 'none',
                fontSize: '14px',
                transition: 'color 0.3s ease'
              }}
            >
              Pas encore de compte ? S'inscrire
            </Link>
          </div>

          {/* Info pour les nouveaux utilisateurs */}
          <div style={{
            marginTop: '20px',
            padding: '16px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#93c5fd',
            textAlign: 'center'
          }}>
            <strong>Nouveau candidat ?</strong><br />
            Utilisez le nom d'utilisateur et le mot de passe que vous avez choisis lors de l'inscription.
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
