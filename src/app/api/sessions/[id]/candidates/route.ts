import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Pour le moment, on contourne l'authentification pour tester
    // TODO: Corriger l'authentification avec NextAuth dans App Router
    
    const { id: sessionId } = await params

    // Récupérer les candidats de la session avec informations d'entretien
    const sessionCandidates = await prisma.sessionCandidate.findMany({
      where: {
        sessionId: sessionId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            matricule: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Récupérer les entretiens pour ces candidats
    const candidateIds = sessionCandidates.map((sc: any) => sc.user.id)
    const interviews = await prisma.interview.findMany({
      where: {
        sessionId: sessionId,
        candidateId: { in: candidateIds }
      },
      select: {
        id: true,
        candidateId: true,
        decision: true,
        createdAt: true,
        updatedAt: true,
        interviewerId: true,
        interviewer: {
          select: {
            username: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Formater les données pour correspondre à l'interface attendue
    const formattedCandidates = sessionCandidates.map((sc: any) => {
      const candidateInterview = interviews.find((i: any) => i.candidateId === sc.user.id)
      
      return {
        id: sc.user.id,
        firstName: sc.user.firstName || sc.user.username,
        lastName: sc.user.lastName || '',
        email: sc.user.email || '',
        phone: '', // Le champ phone n'existe pas dans le schéma
        registeredAt: sc.createdAt.toISOString(),
        interview: candidateInterview ? {
          id: candidateInterview.id,
          status: candidateInterview.decision ? 'COMPLETED' : 'IN_PROGRESS',
          completedAt: candidateInterview.decision ? candidateInterview.updatedAt?.toISOString() : undefined,
          conductedBy: candidateInterview.interviewer 
            ? (candidateInterview.interviewer.firstName 
                ? `${candidateInterview.interviewer.firstName} ${candidateInterview.interviewer.lastName}`
                : candidateInterview.interviewer.username)
            : 'Non assigné'
        } : undefined
      }
    })

    console.log('Candidats de la session', sessionId, ':', formattedCandidates.length)
    return NextResponse.json(formattedCandidates)
  } catch (error) {
    console.error('Erreur lors de la récupération des candidats:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Pour le moment, on contourne l'authentification pour tester
    // TODO: Corriger l'authentification avec NextAuth dans App Router
    
    const { id: sessionId } = await params
    const { userId, status } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'ID utilisateur requis' }, { status: 400 })
    }

    // Vérifier si le candidat est déjà inscrit
    const existingRegistration = await prisma.sessionCandidate.findUnique({
      where: {
        sessionId_userId: {
          sessionId: sessionId,
          userId: userId
        }
      }
    })

    if (existingRegistration) {
      return NextResponse.json({ error: 'Candidat déjà inscrit' }, { status: 400 })
    }

    // Créer l'inscription
    const newRegistration = await prisma.sessionCandidate.create({
      data: {
        sessionId: sessionId,
        userId: userId,
        status: status || 'REGISTERED'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            matricule: true
          }
        }
      }
    })

    console.log('Candidat inscrit à la session:', newRegistration.id)
    return NextResponse.json(newRegistration)
  } catch (error) {
    console.error('Erreur lors de l\'inscription du candidat:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
