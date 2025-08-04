'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'

export default function ModernNavbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  const navLinks = [
    { href: '/', label: 'Accueil', icon: '🏠' },
    { href: '/about', label: 'À propos', icon: 'ℹ️' },
    { href: '/contact', label: 'Contact', icon: '📧' },
  ]

  return (
    <>
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes logoGlow {
          0% { box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.1); }
          100% { box-shadow: 0 12px 35px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.2); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        
        @keyframes slideDown {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .hover-glow:hover {
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
        }
      `}</style>

      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        background: isScrolled 
          ? 'rgba(17, 24, 39, 0.95)' 
          : 'rgba(17, 24, 39, 0.8)',
        backdropFilter: isScrolled ? 'blur(20px) saturate(180%)' : 'blur(10px)',
        borderBottom: isScrolled 
          ? '1px solid rgba(59, 130, 246, 0.3)' 
          : '1px solid rgba(75, 85, 99, 0.2)',
        boxShadow: isScrolled 
          ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(59, 130, 246, 0.1)' 
          : '0 4px 16px rgba(0, 0, 0, 0.1)',
      }}>
        
        {/* Animated bottom border */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.6), transparent)',
          opacity: isScrolled ? 1 : 0,
          transition: 'opacity 0.4s ease'
        }} />

        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '80px'
        }}>

          {/* Enhanced Logo */}
          <Link href="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          className="hover-glow"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1.05) translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1) translateY(0)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)',
              backgroundSize: '200% 200%',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              animation: 'logoGlow 3s ease-in-out infinite alternate, gradientShift 4s ease infinite'
            }}>
              <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                animation: 'shimmer 2s infinite'
              }} />
              <span style={{
                fontSize: '24px',
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #ffffff, #e0e7ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                zIndex: 1
              }}>
                L
              </span>
            </div>
            <div>
              <h1 style={{
                fontSize: '24px',
                fontWeight: '700',
                margin: 0,
                background: 'linear-gradient(135deg, #ffffff 0%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.5px'
              }}>
                LSPA Academy
              </h1>
              <p style={{
                fontSize: '12px',
                color: '#9ca3af',
                margin: 0,
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>
                Los Santos Police
              </p>
            </div>
          </Link>

          {/* Navigation Links - Desktop */}
          {!session && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }} className="hidden md:flex">
              {navLinks.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    color: pathname === link.href ? '#60a5fa' : '#d1d5db',
                    backgroundColor: pathname === link.href 
                      ? 'rgba(59, 130, 246, 0.1)' 
                      : 'transparent',
                    border: pathname === link.href 
                      ? '1px solid rgba(59, 130, 246, 0.2)' 
                      : '1px solid transparent',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    animation: `float 3s ease-in-out infinite ${index * 0.5}s`,
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement
                    el.style.color = '#ffffff'
                    el.style.backgroundColor = 'rgba(59, 130, 246, 0.15)'
                    el.style.border = '1px solid rgba(59, 130, 246, 0.3)'
                    el.style.transform = 'translateY(-2px)'
                    el.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement
                    el.style.color = pathname === link.href ? '#60a5fa' : '#d1d5db'
                    el.style.backgroundColor = pathname === link.href 
                      ? 'rgba(59, 130, 246, 0.1)' 
                      : 'transparent'
                    el.style.border = pathname === link.href 
                      ? '1px solid rgba(59, 130, 246, 0.2)' 
                      : '1px solid transparent'
                    el.style.transform = 'translateY(0)'
                    el.style.boxShadow = 'none'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{link.icon}</span>
                  <span style={{ fontWeight: '500', fontSize: '14px' }}>{link.label}</span>
                </Link>
              ))}
            </div>
          )}

          {/* User Section */}
          {session?.user ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              {/* Dashboard Link */}
              <Link
                href={
                  session.user.role === 'DIRECTEUR' || session.user.role === 'SUPERVISEUR' 
                    ? '/admin/dashboard'
                    : session.user.role === 'INSTRUCTEUR'
                    ? '/instructor/dashboard'
                    : '/candidate/dashboard'
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '10px',
                  color: '#60a5fa',
                  textDecoration: 'none',
                  fontWeight: '500',
                  fontSize: '14px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                className="hover-glow"
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)'
                  el.style.transform = 'translateY(-2px)'
                  el.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = 'none'
                }}
              >
                <span>🎯</span>
                <span>Dashboard</span>
              </Link>

              {/* Enhanced User Info */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 16px',
                background: 'rgba(55, 65, 81, 0.5)',
                border: '1px solid rgba(75, 85, 99, 0.3)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'right'
                }} className="hidden md:flex">
                  <span style={{
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {session.user.firstName && session.user.lastName 
                      ? `${session.user.firstName} ${session.user.lastName}` 
                      : session.user.username}
                  </span>
                  <span style={{
                    color: '#60a5fa',
                    fontSize: '12px'
                  }}>{session.user.role}</span>
                </div>
                
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                  animation: 'pulse 2s infinite'
                }}>
                  <span style={{
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}>
                    {session.user.firstName 
                      ? session.user.firstName.charAt(0).toUpperCase() 
                      : session.user.username?.charAt(0).toUpperCase()}
                  </span>
                  
                  {/* Online status indicator */}
                  <div style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    width: '12px',
                    height: '12px',
                    background: '#22c55e',
                    borderRadius: '50%',
                    border: '2px solid #111827',
                    animation: 'pulse 1.5s infinite'
                  }} />
                </div>
                
                <button
                  onClick={handleSignOut}
                  style={{
                    color: '#ef4444',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Se déconnecter"
                  onMouseEnter={(e) => {
                    const el = e.target as HTMLElement
                    el.style.background = 'rgba(239, 68, 68, 0.2)'
                    el.style.transform = 'scale(1.1) rotate(5deg)'
                  }}
                  onMouseLeave={(e) => {
                    const el = e.target as HTMLElement
                    el.style.background = 'rgba(239, 68, 68, 0.1)'
                    el.style.transform = 'scale(1) rotate(0deg)'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>🚪</span>
                </button>
              </div>
            </div>
          ) : (
            /* Enhanced Login/Register buttons */
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Link
                href="/login"
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '10px',
                  color: '#60a5fa',
                  textDecoration: 'none',
                  fontWeight: '500',
                  fontSize: '14px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'rgba(59, 130, 246, 0.1)'
                  el.style.transform = 'translateY(-2px)'
                  el.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.2)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'transparent'
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = 'none'
                }}
              >
                Connexion
              </Link>
              
              <Link
                href="/register"
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '14px',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = 'translateY(-2px) scale(1.05)'
                  el.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = 'translateY(0) scale(1)'
                  el.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)'
                }}
              >
                Inscription
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden"
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '8px',
              padding: '8px',
              color: '#60a5fa',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '20px' }}>☰</span>
            </div>
          </button>
        </div>

        {/* Enhanced Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden" style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'rgba(17, 24, 39, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(75, 85, 99, 0.3)',
            borderTop: 'none',
            animation: 'slideDown 0.3s ease'
          }}>
            <div style={{ padding: '20px' }}>
              {!session && navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    marginBottom: '8px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: pathname === link.href ? '#60a5fa' : '#d1d5db',
                    backgroundColor: pathname === link.href 
                      ? 'rgba(59, 130, 246, 0.1)' 
                      : 'transparent',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
              
              {session?.user && (
                <div style={{ borderTop: '1px solid rgba(75, 85, 99, 0.3)', paddingTop: '16px', marginTop: '16px' }}>
                  <Link
                    href={
                      session.user.role === 'DIRECTEUR' || session.user.role === 'SUPERVISEUR' 
                        ? '/admin/dashboard'
                        : session.user.role === 'INSTRUCTEUR'
                        ? '/instructor/dashboard'
                        : '/candidate/dashboard'
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      marginBottom: '8px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
                      color: '#60a5fa',
                      textDecoration: 'none',
                      fontWeight: '500'
                    }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span>🎯</span>
                    <span>Dashboard</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      handleSignOut()
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      width: '100%',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#f87171',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    <span>🚪</span>
                    <span>Se déconnecter</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  )
}
