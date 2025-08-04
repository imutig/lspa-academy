'use client'

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import ModernNavbar from "@/components/ModernNavbar"
import RoleManager from "@/components/RoleManager"
import SessionManager from "@/components/SessionManager"
import SessionListView from "@/components/SessionListView"
import QuizManager from "@/components/QuizManager"
import { modernDesign, getAnimationDelay } from "@/utils/modernDesign"
import AdminQuizManager from "@/components/AdminQuizManager"
import InterviewQuestionManager from "@/components/InterviewQuestionManager"
import RegistrationCodesManager from "@/components/RegistrationCodesManager"
import SituationManager from "@/components/SituationManager"

interface DashboardStats {
  totalUsers: number
  totalSessions: number
  totalCandidates: number
  totalInstructors: number
  totalQuizzes: number
  activeQuizzes: number
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user.role && !['ADMIN', 'SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role)) {
      router.push('/unauthorized')
    }
  }, [session, router])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user && ['ADMIN', 'SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role || '')) {
      fetchStats()
    }
  }, [session])

  const statsCards = [
    { title: 'Utilisateurs', value: stats?.totalUsers || 0, icon: '👥', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' },
    { title: 'Candidats', value: stats?.totalCandidates || 0, icon: '👤', color: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' },
    { title: 'Instructeurs', value: stats?.totalInstructors || 0, icon: '👨‍🏫', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' },
    { title: 'Sessions Actives', value: stats?.totalSessions || 0, icon: '📚', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
    { title: 'Quiz Actifs', value: stats?.activeQuizzes || 0, icon: '📝', color: '#06b6d4', gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' },
  ]

  // Global styles for the entire component
  const styles = (
    <style jsx>{`
      @keyframes modernFadeIn {
        0% { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes modernSlideIn {
        0% { opacity: 0; transform: translateX(-20px); }
        100% { opacity: 1; transform: translateX(0); }
      }
      
      @keyframes modernScale {
        0% { opacity: 0; transform: scale(0.95); }
        100% { opacity: 1; transform: scale(1); }
      }
      
      @keyframes modernPulse {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
      }
      
      @keyframes modernFloat {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-6px); }
      }
      
      @keyframes modernShimmer {
        0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
        100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
      }
      
      @keyframes modernGlow {
        0% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
        100% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.6); }
      }
      
      @keyframes modernRotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes modernGradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `}</style>
  )

  if (status === 'loading' || loading) {
    return (
      <>
        {styles}
        <div style={{
          minHeight: '100vh',
          background: modernDesign.backgrounds.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            zIndex: 2,
            ...modernDesign.glass.card,
            padding: '48px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              border: '4px solid transparent',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'modernRotate 1s linear infinite'
            }}></div>
            <h2 style={{
              ...modernDesign.typography.subtitle,
              margin: '0',
              background: 'linear-gradient(135deg, #ffffff 0%, #60a5fa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Tableau de Bord Administrateur
            </h2>
            <p style={{
              ...modernDesign.typography.body,
              margin: '0',
              opacity: 0.8
            }}>
              Chargement des données...
            </p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {styles}
      <div style={{
        minHeight: '100vh',
        background: modernDesign.backgrounds.primary,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <ModernNavbar />
        
        <div style={{
          position: 'relative',
          zIndex: 2,
          padding: '20px',
          paddingTop: '100px'
        }}>
          <div style={{
            marginBottom: '40px',
            opacity: loading ? 0.6 : 1,
            transition: 'opacity 0.3s ease'
          }}>
            <h1 style={{
              ...modernDesign.typography.title,
              textAlign: 'center',
              marginBottom: '48px',
              fontSize: '42px'
            }}>
              Tableau de Bord Administrateur
            </h1>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
              marginBottom: '48px'
            }}>
              {statsCards.map((card, index) => (
                <div
                  key={card.title}
                  style={{
                    ...modernDesign.glass.card,
                    padding: '32px',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    animation: `modernFadeIn 0.6s ease-out ${getAnimationDelay(index)}`,
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={(e) => {
                    Object.assign(e.currentTarget.style, {
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: `0 20px 40px rgba(${card.color === '#3b82f6' ? '59, 130, 246' : card.color === '#22c55e' ? '34, 197, 94' : card.color === '#8b5cf6' ? '139, 92, 246' : card.color === '#f59e0b' ? '245, 158, 11' : '6, 182, 212'}, 0.3)`
                    })
                  }}
                  onMouseLeave={(e) => {
                    Object.assign(e.currentTarget.style, {
                      transform: 'none',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                    })
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: card.gradient,
                    transform: 'scaleX(0)',
                    transformOrigin: 'left',
                    animation: `modernSlideIn 0.8s ease-out ${getAnimationDelay(index, 0.2)} forwards`
                  }}></div>
                  
                  <div style={{
                    fontSize: '48px',
                    marginBottom: '16px',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                  }}>
                    {card.icon}
                  </div>
                  
                  <div style={{
                    fontSize: '36px',
                    fontWeight: '700',
                    color: card.color,
                    marginBottom: '8px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}>
                    {card.value}
                  </div>
                  
                  <div style={{
                    ...modernDesign.typography.body,
                    color: '#d1d5db',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}>
                    {card.title}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '32px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {[
              { key: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
              { key: 'roles', label: 'Rôles', icon: '👔' },
              { key: 'sessions', label: 'Sessions', icon: '📚' },
              { key: 'quizzes', label: 'Quiz', icon: '📝' },
              { key: 'admin-quizzes', label: 'Gestion Quiz', icon: '⚙️' },
              { key: 'questions', label: 'Questions', icon: '❓' },
              { key: 'situations', label: 'Situations', icon: '🎯' },
              { key: 'codes', label: 'Codes', icon: '🔑' }
            ].map((tab, index) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  ...(activeTab === tab.key ? modernDesign.buttons.primary : modernDesign.buttons.secondary),
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  animation: `modernSlideIn 0.4s ease-out ${getAnimationDelay(index, 0.1)}`,
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.key) {
                    Object.assign(e.currentTarget.style, {
                      background: 'rgba(59, 130, 246, 0.1)',
                      transform: 'translateY(-2px)'
                    })
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.key) {
                    Object.assign(e.currentTarget.style, {
                      background: 'transparent',
                      transform: 'none'
                    })
                  }
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {activeTab === tab.key && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                    animation: 'modernShimmer 1s ease-in-out'
                  }}></div>
                )}
              </button>
            ))}
          </div>

          <div style={{
            opacity: loading ? 0.6 : 1,
            transition: 'opacity 0.3s ease'
          }}>
            {activeTab === 'overview' && (
              <div style={{
                animation: 'modernFadeIn 0.5s ease-out',
                ...modernDesign.glass.card,
                padding: '40px',
                textAlign: 'center'
              }}>
                <h2 style={{
                  ...modernDesign.typography.subtitle,
                  marginBottom: '24px',
                  background: 'linear-gradient(135deg, #ffffff 0%, #60a5fa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  Bienvenue dans le tableau de bord administrateur
                </h2>
                <p style={{
                  ...modernDesign.typography.body,
                  fontSize: '16px',
                  lineHeight: '1.6',
                  maxWidth: '600px',
                  margin: '0 auto'
                }}>
                  Gérez les utilisateurs, sessions, quiz et tous les aspects de l'académie LSPA depuis cette interface centralisée.
                  Utilisez les onglets ci-dessus pour naviguer entre les différentes sections.
                </p>
              </div>
            )}

            {activeTab === 'roles' && (
              <div style={{ animation: 'modernFadeIn 0.5s ease-out' }}>
                <RoleManager />
              </div>
            )}

            {activeTab === 'sessions' && (
              <div style={{ animation: 'modernFadeIn 0.5s ease-out' }}>
                <SessionManager userRole={session?.user.role || ''} />
              </div>
            )}

            {activeTab === 'quizzes' && (
              <div style={{ animation: 'modernFadeIn 0.5s ease-out' }}>
                <QuizManager />
              </div>
            )}

            {activeTab === 'admin-quizzes' && (
              <div style={{ animation: 'modernFadeIn 0.5s ease-out' }}>
                <AdminQuizManager userRole={session?.user.role || ''} />
              </div>
            )}

            {activeTab === 'questions' && (
              <div style={{ animation: 'modernFadeIn 0.5s ease-out' }}>
                <InterviewQuestionManager />
              </div>
            )}

            {activeTab === 'codes' && (
              <div style={{ animation: 'modernFadeIn 0.5s ease-out' }}>
                <RegistrationCodesManager userRole={session?.user.role || ''} />
              </div>
            )}

            {activeTab === 'situations' && (
              <div style={{ animation: 'modernFadeIn 0.5s ease-out' }}>
                <SituationManager />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
