'use client'

import { useState, useEffect } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsLoaded(true)
    
    // Vérifier si l'utilisateur est déjà connecté
    getSession().then((session) => {
      if (session) {
        const role = session.user.role
        if (role === 'DIRECTEUR' || role === 'SUPERVISEUR') {
          router.push('/admin/dashboard')
        } else if (role === 'INSTRUCTEUR') {
          router.push('/instructor/dashboard')
        } else {
          router.push('/candidate/dashboard')
        }
      }
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email ou mot de passe incorrect')
      } else {
        // Redirection basée sur le rôle
        const session = await getSession()
        if (session) {
          const role = session.user.role
          if (role === 'DIRECTEUR' || role === 'SUPERVISEUR') {
            router.push('/admin/dashboard')
          } else if (role === 'INSTRUCTEUR') {
            router.push('/instructor/dashboard')
          } else {
            router.push('/candidate/dashboard')
          }
        }
      }
    } catch (error) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #151515 50%, #1f1f1f 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Particles d'arrière-plan */}
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', zIndex: 1}}>
        <div style={{
          position: 'absolute',
          top: '-16px',
          left: '-16px',
          width: '288px',
          height: '288px',
          backgroundColor: '#3b82f6',
          borderRadius: '50%',
          mixBlendMode: 'multiply',
          filter: 'blur(60px)',
          opacity: 0.2,
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-32px',
          right: '-16px',
          width: '288px',
          height: '288px',
          backgroundColor: '#8b5cf6',
          borderRadius: '50%',
          mixBlendMode: 'multiply',
          filter: 'blur(60px)',
          opacity: 0.2,
          animation: 'float 6s ease-in-out infinite',
          animationDelay: '2s'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '384px',
          height: '384px',
          backgroundColor: '#2563eb',
          borderRadius: '50%',
          mixBlendMode: 'multiply',
          filter: 'blur(60px)',
          opacity: 0.1,
          animation: 'pulse 4s ease-in-out infinite'
        }}></div>
      </div>

      <div style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          transition: 'all 1s ease-out',
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(32px)'
        }}>
          
          {/* Logo et titre */}
          <div style={{textAlign: 'center', marginBottom: '32px'}}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto',
              animation: 'glow 2s ease-in-out infinite alternate'
            }}>
              <span style={{color: 'white', fontWeight: 'bold', fontSize: '24px'}}>L</span>
            </div>
            <h1 style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '8px',
              margin: '0 0 8px 0'
            }}>
              <span style={{
                background: 'linear-gradient(to right, #60a5fa, #3b82f6, #2563eb)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                LSPA
              </span>
            </h1>
            <h2 style={{
              fontSize: '20px',
              color: '#93c5fd',
              marginBottom: '8px',
              fontWeight: '300',
              margin: '0 0 8px 0'
            }}>
              Los Santos Police Academy
            </h2>
            <p style={{fontSize: '14px', color: '#9ca3af', margin: '0'}}>GrandLineFA</p>
          </div>

          {/* Formulaire de connexion */}
          <div style={{
            background: 'rgba(21, 21, 21, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              marginBottom: '24px',
              margin: '0 0 24px 0'
            }}>
              Connexion
            </h3>

            {error && (
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#fca5a5',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
              <div>
                <label htmlFor="email" style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#d1d5db',
                  marginBottom: '8px'
                }}>
                  Adresse email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#1f1f1f',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#374151'}
                  placeholder="votre@email.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#d1d5db',
                  marginBottom: '8px'
                }}>
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#1f1f1f',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#374151'}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: loading ? '#6b7280' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  opacity: loading ? 0.5 : 1,
                  transform: 'translateY(0)',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    const target = e.target as HTMLButtonElement;
                    target.style.transform = 'translateY(-2px) scale(1.02)';
                    target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    const target = e.target as HTMLButtonElement;
                    target.style.transform = 'translateY(0) scale(1)';
                    target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                  }
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <span>Connexion...</span>
                  </>
                ) : (
                  <>
                    <span>🔑</span>
                    <span>Se connecter</span>
                  </>
                )}
              </button>
            </form>

            <div style={{
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: '1px solid #374151'
            }}>
              <p style={{
                textAlign: 'center',
                color: '#9ca3af',
                fontSize: '14px',
                margin: '0'
              }}>
                Pas encore de compte ?{' '}
                <Link href="/auth/signup" style={{
                  color: '#60a5fa',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLAnchorElement;
                  target.style.color = '#93c5fd';
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLAnchorElement;
                  target.style.color = '#60a5fa';
                }}>
                  Créer un compte
                </Link>
              </p>
            </div>
          </div>

          {/* Retour à l'accueil */}
          <div style={{marginTop: '24px', textAlign: 'center'}}>
            <Link 
              href="/"
              style={{
                color: '#9ca3af',
                textDecoration: 'none',
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'color 0.2s ease',
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(21, 21, 21, 0.5)',
                border: '1px solid rgba(59, 130, 246, 0.1)'
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLAnchorElement;
                target.style.color = '#ffffff';
                target.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLAnchorElement;
                target.style.color = '#9ca3af';
                target.style.backgroundColor = 'rgba(21, 21, 21, 0.5)';
                target.style.borderColor = 'rgba(59, 130, 246, 0.1)';
              }}
            >
              <span>←</span>
              <span>Retour à l'accueil</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
