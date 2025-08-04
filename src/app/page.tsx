'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { data: session, status } = useSession()
  const [isLoaded, setIsLoaded] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (session) {
      const role = session.user?.role
      if (role === 'DIRECTEUR' || role === 'SUPERVISEUR') {
        router.push('/admin/dashboard')
      } else if (role === 'INSTRUCTEUR') {
        router.push('/instructor/dashboard')
      } else {
        router.push('/candidate/dashboard')
      }
    }
  }, [session, router])

  const features = [
    {
      icon: '🎓',
      title: 'Formation d\'Excellence',
      description: 'Programme de formation complet pour devenir policier qualifié dans l\'univers GTA RP.'
    },
    {
      icon: '📋',
      title: 'Candidatures en Ligne',
      description: 'Processus de candidature simple et efficace avec suivi en temps réel.'
    },
    {
      icon: '📊',
      title: 'Suivi des Progrès',
      description: 'Dashboard personnalisé pour suivre votre progression et vos résultats.'
    },
    {
      icon: '🏆',
      title: 'Certification',
      description: 'Obtenez votre certification officielle LSPA reconnue sur GrandLineFA.'
    }
  ]

  const stats = [
    { number: '500+', label: 'Policiers Formés' },
    { number: '98%', label: 'Taux de Réussite' },
    { number: '24/7', label: 'Support Disponible' },
    { number: '15+', label: 'Instructeurs Experts' }
  ]

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-dark-100 to-dark-200 flex items-center justify-center">
        <div className="spinner-lg"></div>
      </div>
    )
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
          top: '-40px',
          left: '-40px',
          width: '384px',
          height: '384px',
          backgroundColor: '#3b82f6',
          borderRadius: '50%',
          mixBlendMode: 'multiply',
          filter: 'blur(60px)',
          opacity: 0.2,
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-40px',
          right: '-40px',
          width: '384px',
          height: '384px',
          backgroundColor: '#8b5cf6',
          borderRadius: '50%',
          mixBlendMode: 'multiply',
          filter: 'blur(60px)',
          opacity: 0.2,
          animation: 'float 6s ease-in-out infinite',
          animationDelay: '3s'
        }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-20" style={{padding: '24px'}}>
        <div className="max-w-7xl mx-auto flex items-center justify-between" style={{maxWidth: '80rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div className="flex items-center space-x-4" style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center animate-glow" style={{width: '48px', height: '48px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <span className="text-white font-bold text-lg" style={{color: 'white', fontWeight: 'bold', fontSize: '18px'}}>L</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" style={{fontSize: '24px', fontWeight: 'bold', color: 'white', margin: '0'}}>LSPA</h1>
              <p className="text-xs text-gray-400" style={{fontSize: '12px', color: '#9ca3af', margin: '0'}}>GrandLineFA</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4" style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
            <Link href="/login" className="btn-secondary" style={{padding: '8px 16px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', textDecoration: 'none', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)'}}>
              Se connecter
            </Link>
            <Link href="/register" className="btn-primary" style={{padding: '8px 16px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', textDecoration: 'none', borderRadius: '8px'}}>
              S'inscrire
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20" style={{position: 'relative', zIndex: 10, maxWidth: '80rem', margin: '0 auto', padding: '0 24px', paddingTop: '80px'}}>
        <div className={`text-center transition-all duration-1000 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`} style={{textAlign: 'center', marginBottom: '64px'}}>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight" style={{fontSize: 'clamp(48px, 8vw, 96px)', fontWeight: 'bold', color: 'white', marginBottom: '24px', lineHeight: 1.1}}>
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent" style={{background: 'linear-gradient(to right, #60a5fa, #3b82f6, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
              Los Santos
            </span>
            <br />
            <span className="text-white" style={{color: 'white'}}>Police Academy</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed" style={{fontSize: 'clamp(18px, 3vw, 24px)', color: '#d1d5db', marginBottom: '32px', maxWidth: '48rem', margin: '0 auto 32px auto', lineHeight: 1.6}}>
            Rejoignez l'élite de la police de Los Santos. Formation d'excellence, 
            carrière prestigieuse, service public d'honneur.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16" style={{display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center', alignItems: 'center', marginBottom: '64px'}}>
            <Link href="/register" className="btn-primary px-8 py-4 text-lg" style={{padding: '16px 32px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', textDecoration: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: '500'}}>
              🎯 Commencer ma Formation
            </Link>
            <Link href="/login" className="btn-secondary px-8 py-4 text-lg" style={{padding: '16px 32px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', textDecoration: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: '500', border: '1px solid rgba(59, 130, 246, 0.2)'}}>
              📊 Accéder à mon Dashboard
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 mb-20 transition-all duration-1000 delay-300 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`} style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px', marginBottom: '80px'}}>
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="glass rounded-2xl p-6 text-center hover:scale-105 transition-transform duration-300"
              style={{
                background: 'rgba(21, 21, 21, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                transition: 'transform 0.3s ease'
              }}
            >
              <div className="text-3xl font-bold text-blue-400 mb-2" style={{fontSize: '24px', fontWeight: 'bold', color: '#60a5fa', marginBottom: '8px'}}>{stat.number}</div>
              <div className="text-gray-300 text-sm" style={{color: '#d1d5db', fontSize: '14px'}}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className={`grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20 transition-all duration-1000 delay-500 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`} style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px', marginBottom: '80px'}}>
          {features.map((feature, index) => (
            <div 
              key={index}
              className="glass rounded-2xl p-8 hover:scale-105 transition-all duration-300 group"
              style={{
                background: 'rgba(21, 21, 21, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '16px',
                padding: '32px',
                transition: 'all 0.3s ease'
              }}
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300" style={{fontSize: '32px', marginBottom: '16px', transition: 'transform 0.3s ease'}}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-4" style={{fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '16px'}}>{feature.title}</h3>
              <p className="text-gray-300 text-sm leading-relaxed" style={{color: '#d1d5db', fontSize: '14px', lineHeight: 1.6}}>{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className={`glass rounded-3xl p-12 text-center mb-20 transition-all duration-1000 delay-700 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`} style={{
          background: 'rgba(21, 21, 21, 0.8)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '24px',
          padding: '48px',
          textAlign: 'center',
          marginBottom: '80px'
        }}>
          <h2 className="text-4xl font-bold text-white mb-6" style={{fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '24px'}}>
            Prêt à servir et protéger ?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto" style={{fontSize: '20px', color: '#d1d5db', marginBottom: '32px', maxWidth: '42rem', margin: '0 auto 32px auto'}}>
            Rejoignez les rangs de la police de Los Santos et faites la différence 
            dans l'univers GrandLineFA.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center" style={{display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center', alignItems: 'center'}}>
            <Link href="/register" className="btn-primary px-8 py-4 text-lg" style={{padding: '16px 32px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', textDecoration: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: '500'}}>
              🚔 Devenir Policier
            </Link>
            <Link href="/about" className="btn-secondary px-8 py-4 text-lg" style={{padding: '16px 32px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', textDecoration: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: '500', border: '1px solid rgba(59, 130, 246, 0.2)'}}>
              📖 En savoir plus
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 glass" style={{
        position: 'relative',
        zIndex: 10,
        background: 'rgba(21, 21, 21, 0.8)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: 'none'
      }}>
        <div className="max-w-7xl mx-auto px-6 py-8" style={{maxWidth: '80rem', margin: '0 auto', padding: '32px 24px'}}>
          <div className="flex flex-col md:flex-row justify-between items-center" style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', gap: '16px'}}>
            <div className="flex items-center space-x-4 mb-4 md:mb-0" style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center" style={{width: '40px', height: '40px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <span className="text-white font-bold" style={{color: 'white', fontWeight: 'bold'}}>L</span>
              </div>
              <div>
                <h3 className="text-white font-bold" style={{color: 'white', fontWeight: 'bold', margin: '0'}}>LSPA</h3>
                <p className="text-gray-400 text-sm" style={{color: '#9ca3af', fontSize: '14px', margin: '0'}}>Los Santos Police Academy</p>
              </div>
            </div>
            
            <div className="text-center md:text-right" style={{textAlign: 'center'}}>
              <p className="text-gray-400 text-sm" style={{color: '#9ca3af', fontSize: '14px', margin: '0'}}>
                © 2025 GrandLineFA - Tous droits réservés
              </p>
              <p className="text-gray-500 text-xs mt-1" style={{color: '#6b7280', fontSize: '12px', marginTop: '4px'}}>
                Formation d'excellence pour l'élite policière
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
