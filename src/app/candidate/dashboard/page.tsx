'use client'

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import ModernNavbar from "@/components/ModernNavbar"
import InterviewManager from "@/components/InterviewManager"
import QuizManager from "@/components/QuizManager"
import CandidateSessionList from "@/components/CandidateSessionList"
import NotificationBanner from "@/components/NotificationBanner"

export default function CandidateDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({
    completedSessions: 0,
    pendingInterviews: 0,
    completedQuizzes: 0,
    totalScore: 0
  })
  const [loading, setLoading] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)

  // Color mapping helper
  const getColorRgb = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: '59, 130, 246',
      green: '34, 197, 94',
      yellow: '234, 179, 8',
      red: '239, 68, 68',
      purple: '147, 51, 234',
      orange: '249, 115, 22'
    }
    return colorMap[color] || '59, 130, 246'
  }

  useEffect(() => {
    setIsLoaded(true)
    
    // Vérifier les paramètres URL pour l'ouverture directe d'un quiz
    const urlParams = new URLSearchParams(window.location.search)
    const activeTabParam = urlParams.get('activeTab')
    const quizId = urlParams.get('quizId')
    
    if (activeTabParam === 'quiz' && quizId) {
      setActiveTab('quiz')
    }
  }, [])

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.role !== 'CANDIDAT') {
      router.push('/')
      return
    }

    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    try {
      // Récupérer les vraies données depuis l'API
      const [registrationsRes] = await Promise.all([
        fetch('/api/candidate/registrations')
      ])

      if (registrationsRes.ok) {
        const registrations = await registrationsRes.json()
        setStats({
          completedSessions: registrations.filter((r: any) => r.session.status === 'CLOSED').length,
          pendingInterviews: 0, // À implémenter quand les interviews seront prêtes
          completedQuizzes: 0,  // À implémenter quand les quiz seront prêts
          totalScore: 0         // À calculer depuis les résultats de quiz
        })
      } else {
        setStats({
          completedSessions: 0,
          pendingInterviews: 0,
          completedQuizzes: 0,
          totalScore: 0
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
      setStats({
        completedSessions: 0,
        pendingInterviews: 0,
        completedQuizzes: 0,
        totalScore: 0
      })
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #111827 50%, #1f2937 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0px)' : 'translateY(20px)',
          transition: 'all 0.6s ease'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(59, 130, 246, 0.3)',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{
            color: 'white',
            fontSize: '18px',
            fontWeight: '500'
          }}>Chargement de votre espace...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
    { id: 'sessions', label: 'Mes Sessions', icon: '📚' },
    { id: 'quizzes', label: 'Quiz', icon: '📝' },
  ]

  const statCards = [
    { title: 'Sessions Complétées', value: stats.completedSessions, icon: '✅', color: 'green' },
    { title: 'Quiz Terminés', value: stats.completedQuizzes, icon: '📝', color: 'blue' },
    { title: 'Score Moyen', value: `${stats.totalScore}%`, icon: '🎯', color: 'purple' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000000 0%, #111827 50%, #1f2937 100%)'
    }}>
      <NotificationBanner />
      <ModernNavbar />
      
      <div style={{paddingTop: '64px'}}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '32px 16px'
        }}>
          
          {/* Header */}
          <div style={{
            marginBottom: '32px',
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0px)' : 'translateY(20px)',
            transition: 'all 0.6s ease'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <h1 style={{
                  fontSize: '36px',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '8px',
                  background: 'linear-gradient(135deg, #ffffff 0%, #60a5fa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Espace Candidat
                </h1>
                <p style={{
                  color: '#9ca3af',
                  fontSize: '16px'
                }}>
                                    Bienvenue, {session?.user.firstName && session?.user.lastName ? `${session.user.firstName} ${session.user.lastName}` : session?.user.username} • Suivez votre progression
                </p>
              </div>
              
              <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'rgba(17, 24, 39, 0.7)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(75, 85, 99, 0.3)',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    background: '#3b82f6',
                    borderRadius: '50%',
                    animation: 'pulse 2s infinite'
                  }}></div>
                  <span style={{color: '#d1d5db', fontSize: '14px'}}>Candidat actif</span>
                </div>
              </div>
            </div>
          </div>

          {/* Onglets de navigation */}
          <div style={{
            marginBottom: '32px',
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0px)' : 'translateY(30px)',
            transition: 'all 0.8s ease 0.2s'
          }}>
            <div style={{
              display: 'flex',
              gap: '4px',
              background: 'rgba(31, 41, 55, 0.5)',
              padding: '4px',
              borderRadius: '12px',
              backdropFilter: 'blur(8px)',
              overflowX: 'auto'
            }}>
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontSize: '14px',
                    fontWeight: '500',
                    background: activeTab === tab.id ? '#3b82f6' : 'transparent',
                    color: activeTab === tab.id ? 'white' : '#9ca3af',
                    boxShadow: activeTab === tab.id ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      (e.target as HTMLElement).style.background = 'rgba(255, 255, 255, 0.1)'
                      ;(e.target as HTMLElement).style.color = 'white'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      (e.target as HTMLElement).style.background = 'transparent'
                      ;(e.target as HTMLElement).style.color = '#9ca3af'
                    }
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Contenu principal */}
          <div style={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0px)' : 'translateY(40px)',
            transition: 'all 1s ease 0.4s'
          }}>
            {activeTab === 'overview' && (
              <div style={{display: 'flex', flexDirection: 'column', gap: '32px'}}>
                {/* Cartes de statistiques */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  {statCards.map((card, index) => (
                    <div
                      key={card.title}
                      style={{
                        background: 'rgba(17, 24, 39, 0.7)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(75, 85, 99, 0.3)',
                        borderRadius: '16px',
                        padding: '24px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        opacity: isLoaded ? 1 : 0,
                        transform: isLoaded ? 'scale(1)' : 'scale(0.9)',
                        transitionDelay: `${index * 100}ms`
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLElement).style.transform = 'translateY(-4px)'
                        ;(e.target as HTMLElement).style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)'
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLElement).style.transform = 'translateY(0px)'
                        ;(e.target as HTMLElement).style.boxShadow = 'none'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '16px'
                      }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          background: `rgba(${getColorRgb(card.color)}, 0.2)`,
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <span style={{fontSize: '24px'}}>{card.icon}</span>
                        </div>
                      </div>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: 'white',
                        marginBottom: '4px'
                      }}>{card.value}</div>
                      <div style={{
                        fontSize: '14px',
                        color: '#9ca3af'
                      }}>{card.title}</div>
                    </div>
                  ))}
                </div>

                {/* Vue d'ensemble */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                  gap: '32px'
                }}>
                  {/* Prochaines échéances */}
                  <div style={{
                    background: 'rgba(17, 24, 39, 0.7)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(75, 85, 99, 0.3)',
                    borderRadius: '16px',
                    padding: '24px'
                  }}>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: 'white',
                      marginBottom: '24px'
                    }}>Prochaines Échéances</h3>
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '40px 20px',
                      color: '#9ca3af',
                      fontStyle: 'italic'
                    }}>
                      <span style={{fontSize: '48px', marginBottom: '16px', display: 'block'}}>�</span>
                      <p style={{margin: 0}}>Aucune échéance programmée pour le moment</p>
                    </div>
                  </div>

                  {/* Activité récente */}
                  <div style={{
                    background: 'rgba(17, 24, 39, 0.7)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(75, 85, 99, 0.3)',
                    borderRadius: '16px',
                    padding: '24px'
                  }}>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: 'white',
                      marginBottom: '24px'
                    }}>Activité Récente</h3>
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '40px 20px',
                      color: '#9ca3af',
                      fontStyle: 'italic'
                    }}>
                      <span style={{fontSize: '48px', marginBottom: '16px', display: 'block'}}>📊</span>
                      <p style={{margin: 0}}>Aucune activité récente</p>
                    </div>
                  </div>
                </div>

                {/* Graphique de progression */}
                <div style={{
                  background: 'rgba(17, 24, 39, 0.7)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(75, 85, 99, 0.3)',
                  borderRadius: '16px',
                  padding: '24px'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: 'white',
                    marginBottom: '24px'
                  }}>Progression Générale</h3>
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '40px 20px',
                    color: '#9ca3af',
                    fontStyle: 'italic'
                  }}>
                    <span style={{fontSize: '48px', marginBottom: '16px', display: 'block'}}>📊</span>
                    <p style={{margin: 0}}>Les données de progression seront disponibles une fois que vous aurez commencé votre formation</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sessions' && (
              <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
                <CandidateSessionList />
              </div>
            )}

            {activeTab === 'quizzes' && <QuizManager />}
          </div>
        </div>
      </div>
    </div>
  )
}
