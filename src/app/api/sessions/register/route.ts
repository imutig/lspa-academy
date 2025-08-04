import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { sessionId, candidateId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'ID de session requis' }, { status: 400 })
    }

    // Pour les candidats, ils s'inscrivent eux-mêmes
    // Pour les instructeurs+, ils peuvent inscrire des candidats spécifiques
    const targetCandidateId = candidateId || session.user.id

    console.log('Données d\'inscription:', {
      sessionId,
      candidateId,
      sessionUserId: session.user.id,
      targetCandidateId
    })

    // Vérifier que la session existe et est ouverte
    const policeSession = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        _count: {
          select: { candidates: true }
        }
      }
    })

    if (!policeSession) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 })
    }

    if (policeSession.status !== 'PLANNED') {
      return NextResponse.json({ error: 'Session non ouverte aux inscriptions' }, { status: 400 })
    }

    // Vérifier que l'utilisateur cible existe
    const targetUser = await prisma.user.findUnique({
      where: { id: targetCandidateId }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Vérifier que le candidat n'est pas déjà inscrit
    const existingRegistration = await prisma.sessionCandidate.findFirst({
      where: {
        sessionId: sessionId,
        userId: targetCandidateId
      }
    })

    if (existingRegistration) {
      return NextResponse.json({ error: 'Candidat déjà inscrit' }, { status: 400 })
    }

    // Vérifier le nombre maximum de candidats
    if (policeSession.maxCandidates && policeSession._count.candidates >= policeSession.maxCandidates) {
      return NextResponse.json({ error: 'Session complète' }, { status: 400 })
    }

    // Inscrire le candidat
    console.log('Tentative d\'inscription:', {
      sessionId,
      targetCandidateId,
      sessionExists: !!policeSession,
      userExists: !!targetUser
    })

    const registration = await prisma.sessionCandidate.create({
      data: {
        sessionId: sessionId,
        userId: targetCandidateId,
        status: 'REGISTERED'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            matricule: true
          }
        },
        session: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    })

    return NextResponse.json({ registration })
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const url = new URL(request.url)
    const sessionId = url.searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'ID de session requis' }, { status: 400 })
    }

    const registrations = await prisma.sessionCandidate.findMany({
      where: { sessionId: sessionId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            matricule: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({ registrations })
  } catch (error) {
    console.error('Erreur lors de la récupération des inscriptions:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
