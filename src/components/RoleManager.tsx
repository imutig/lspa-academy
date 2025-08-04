'use client'

import { useState, useEffect } from 'react'
import { modernDesign } from '../utils/modernDesign'

interface User {
  id: string
  username: string
  email: string
  role: string
  matricule?: string
  createdAt: string
  firstName?: string
  lastName?: string
}

export default function RoleManager() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const roles = [
    { value: 'CANDIDAT', label: 'Candidat', color: '#60a5fa', emoji: '👤' },
    { value: 'INSTRUCTEUR', label: 'Instructeur', color: '#34d399', emoji: '👨‍🏫' },
    { value: 'SUPERVISEUR', label: 'Superviseur', color: '#fbbf24', emoji: '👔' },
    { value: 'DIRECTEUR', label: 'Directeur', color: '#f87171', emoji: '🎯' }
  ]

  useEffect(() => {
    fetchUsers()
    setTimeout(() => setIsLoaded(true), 100)
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/roles')
      const data = await response.json()
      
      if (response.ok) {
        setUsers(data.users)
      } else {
        console.error('Erreur:', data.error)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          role: newRole
        })
      })

      const data = await response.json()

      if (response.ok) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ))
        setEditingRole(null)
      } else {
        console.error('Erreur:', data.error)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error)
    }
  }

  const getRoleInfo = (roleValue: string) => {
    return roles.find(role => role.value === roleValue) || { 
      value: roleValue, 
      label: roleValue, 
      color: '#9ca3af',
      emoji: '❓'
    }
  }

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

  if (loading) {
    return (
      <>
        {styles}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px',
          ...modernDesign.glass.card
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid transparent',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'modernRotate 1s linear infinite'
            }}></div>
            <p style={{...modernDesign.typography.body, color: '#d1d5db'}}>
              Chargement des utilisateurs...
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
        opacity: isLoaded ? 1 : 0,
        transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease-out'
      }}>
        {/* Modern Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          padding: '24px 0',
          position: 'relative'
        }}>
          <div>
            <h1 style={{
              ...modernDesign.typography.title,
              fontSize: '32px',
              margin: '0 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{
                fontSize: '36px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>👥</span>
              Gestion des Rôles
            </h1>
            <p style={{
              ...modernDesign.typography.body,
              fontSize: '16px',
              margin: '0'
            }}>
              Gérez les rôles et permissions des utilisateurs
            </p>
          </div>
        </div>

        {/* Role Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          {roles.map((role, index) => {
            const count = users.filter(user => user.role === role.value).length
            return (
              <div
                key={role.value}
                style={{
                  ...modernDesign.glass.card,
                  padding: '24px',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  animation: `modernSlideIn 0.5s ease-out ${index * 0.1}s both`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, {
                    transform: 'translateY(-4px) scale(1.02)',
                    boxShadow: `0 12px 25px ${role.color}40`
                  })
                }}
                onMouseLeave={(e) => {
                  Object.assign(e.currentTarget.style, {
                    transform: 'none',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                  })
                }}
              >
                {/* Role background gradient */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `linear-gradient(135deg, ${role.color}10 0%, ${role.color}05 100%)`,
                  opacity: 0.5
                }} />
                
                <div style={{position: 'relative', zIndex: 1}}>
                  <div style={{
                    fontSize: '32px',
                    marginBottom: '12px'
                  }}>
                    {role.emoji}
                  </div>
                  <div style={{
                    fontSize: '32px',
                    fontWeight: '700',
                    color: role.color,
                    marginBottom: '8px'
                  }}>
                    {count}
                  </div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#e5e7eb',
                    marginBottom: '4px'
                  }}>
                    {role.label}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    {count === 1 ? 'utilisateur' : 'utilisateurs'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Users Table */}
        <div style={{
          ...modernDesign.glass.card,
          padding: '32px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Table background gradient */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
            opacity: 0.5
          }} />
          
          <div style={{position: 'relative', zIndex: 1}}>
            <h3 style={{
              ...modernDesign.typography.subtitle,
              fontSize: '24px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{fontSize: '28px'}}>📋</span>
              Utilisateurs ({users.length})
            </h3>

            {users.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '48px',
                color: '#9ca3af'
              }}>
                <div style={{
                  fontSize: '64px',
                  marginBottom: '16px',
                  opacity: 0.5
                }}>
                  👥
                </div>
                <p style={{
                  ...modernDesign.typography.body,
                  fontSize: '18px',
                  margin: '0'
                }}>
                  Aucun utilisateur trouvé
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gap: '16px'
              }}>
                {users.map((user, index) => {
                  const roleInfo = getRoleInfo(user.role)
                  return (
                    <div
                      key={user.id}
                      style={{
                        ...modernDesign.glass.card,
                        padding: '20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        animation: `modernSlideIn 0.3s ease-out ${index * 0.05}s both`,
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        Object.assign(e.currentTarget.style, {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(59, 130, 246, 0.15)'
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
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        flex: 1
                      }}>
                        {/* User Avatar */}
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${roleInfo.color}40, ${roleInfo.color}20)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          border: `2px solid ${roleInfo.color}40`
                        }}>
                          {roleInfo.emoji}
                        </div>

                        {/* User Info */}
                        <div style={{flex: 1}}>
                          <h4 style={{
                            margin: '0 0 4px 0',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#e5e7eb'
                          }}>
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}`
                              : user.username
                            }
                          </h4>
                          <div style={{
                            display: 'flex',
                            gap: '16px',
                            fontSize: '14px',
                            color: '#9ca3af'
                          }}>
                            <span>📧 {user.email}</span>
                            {user.matricule && <span>🆔 {user.matricule}</span>}
                            <span>📅 {new Date(user.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Role Management */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        {editingRole === user.id ? (
                          <div style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center'
                          }}>
                            <select
                              value={user.role}
                              onChange={(e) => updateRole(user.id, e.target.value)}
                              style={{
                                ...modernDesign.inputs.modern,
                                fontSize: '14px',
                                padding: '8px 12px',
                                minWidth: '140px'
                              }}
                            >
                              {roles.map(role => (
                                <option key={role.value} value={role.value}>
                                  {role.emoji} {role.label}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => setEditingRole(null)}
                              style={{
                                ...modernDesign.buttons.secondary,
                                fontSize: '12px',
                                padding: '6px 12px',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                Object.assign(e.currentTarget.style, {
                                  background: 'rgba(239, 68, 68, 0.2)',
                                  transform: 'scale(1.05)'
                                })
                              }}
                              onMouseLeave={(e) => {
                                Object.assign(e.currentTarget.style, {
                                  background: 'transparent',
                                  transform: 'none'
                                })
                              }}
                            >
                              ❌
                            </button>
                          </div>
                        ) : (
                          <>
                            <div style={{
                              ...modernDesign.badges.info,
                              background: `${roleInfo.color}20`,
                              color: roleInfo.color,
                              fontSize: '14px',
                              fontWeight: '600',
                              padding: '8px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <span>{roleInfo.emoji}</span>
                              <span>{roleInfo.label}</span>
                            </div>
                            <button
                              onClick={() => setEditingRole(user.id)}
                              style={{
                                ...modernDesign.buttons.secondary,
                                fontSize: '12px',
                                padding: '8px 12px',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                Object.assign(e.currentTarget.style, {
                                  background: 'rgba(59, 130, 246, 0.2)',
                                  transform: 'scale(1.05)'
                                })
                              }}
                              onMouseLeave={(e) => {
                                Object.assign(e.currentTarget.style, {
                                  background: 'transparent',
                                  transform: 'none'
                                })
                              }}
                            >
                              ✏️ Modifier
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Role Permissions Info */}
        <div style={{
          ...modernDesign.glass.card,
          padding: '32px',
          marginTop: '32px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Info background gradient */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
            opacity: 0.5
          }} />
          
          <div style={{position: 'relative', zIndex: 1}}>
            <h3 style={{
              ...modernDesign.typography.subtitle,
              fontSize: '24px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{fontSize: '28px'}}>ℹ️</span>
              Permissions des rôles
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {roles.map((role, index) => (
                <div
                  key={role.value}
                  style={{
                    ...modernDesign.glass.card,
                    padding: '20px',
                    border: `1px solid ${role.color}40`,
                    animation: `modernSlideIn 0.3s ease-out ${index * 0.1}s both`
                  }}
                >
                  <h4 style={{
                    margin: '0 0 12px 0',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: role.color,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>{role.emoji}</span>
                    <span>{role.label}</span>
                  </h4>
                  <ul style={{
                    margin: '0',
                    paddingLeft: '20px',
                    color: '#d1d5db',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}>
                    {role.value === 'CANDIDAT' && (
                      <>
                        <li>Passer des quiz</li>
                        <li>Consulter ses résultats</li>
                        <li>Participer aux entretiens</li>
                      </>
                    )}
                    {role.value === 'INSTRUCTEUR' && (
                      <>
                        <li>Créer et gérer des quiz</li>
                        <li>Consulter les résultats</li>
                        <li>Mener des entretiens</li>
                      </>
                    )}
                    {role.value === 'SUPERVISEUR' && (
                      <>
                        <li>Toutes les permissions instructeur</li>
                        <li>Gérer les sessions</li>
                        <li>Consulter les rapports</li>
                      </>
                    )}
                    {role.value === 'DIRECTEUR' && (
                      <>
                        <li>Toutes les permissions</li>
                        <li>Gérer les utilisateurs</li>
                        <li>Configuration système</li>
                      </>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
