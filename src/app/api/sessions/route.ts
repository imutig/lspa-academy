import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Pour le moment, on contourne l'authentification pour tester
    // TODO: Corriger l'authentification avec NextAuth dans App Router
    
    const sessions = await prisma.session.findMany({
      include: {
        _count: {
          select: {
            candidates: true,
            interviews: true,
            sessionQuizzes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('Sessions récupérées:', sessions.length)
    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Erreur lors de la récupération des sessions:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Pour le moment, on contourne l'authentification pour tester
    // TODO: Corriger l'authentification avec NextAuth dans App Router
    
    const { name, description, date, location, maxCandidates } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
    }

    const newSession = await prisma.session.create({
      data: {
        name,
        description: description || '',
        date: date ? new Date(date) : null,
        location: location || null,
        maxCandidates: maxCandidates || 20,
        status: 'PLANNED',
        createdBy: 'admin' // TODO: Utiliser session.user.id quand l'auth sera fixée
      }
    })

    console.log('Nouvelle session créée:', newSession.id)
    return NextResponse.json(newSession)
  } catch (error) {
    console.error('Erreur lors de la création de la session:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer une session
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('id')

    if (!sessionId) {
      return NextResponse.json({ error: 'ID de session requis' }, { status: 400 })
    }

    // Vérifier que la session existe
    const existingSession = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        _count: {
          select: {
            candidates: true,
            sessionQuizzes: true,
            quizAttempts: true
          }
        }
      }
    })

    if (!existingSession) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 })
    }

    // Supprimer en cascade :
    // 1. Les tentatives de quiz liées à cette session
    await prisma.quizAttempt.deleteMany({
      where: { sessionId }
    })

    // 2. Les candidats inscrits à cette session
    await prisma.sessionCandidate.deleteMany({
      where: { sessionId }
    })

    // 3. Les quiz affectés à la session
    await prisma.sessionQuiz.deleteMany({
      where: { sessionId }
    })

    // 4. Enfin, supprimer la session
    await prisma.session.delete({
      where: { id: sessionId }
    })

    console.log('Session supprimée:', sessionId)
    return NextResponse.json({ message: 'Session supprimée avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression de la session:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
