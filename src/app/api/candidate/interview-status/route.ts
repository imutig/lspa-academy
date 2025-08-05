import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'CANDIDAT') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Récupérer les entretiens du candidat pour toutes ses sessions
    const interviews = await prisma.interview.findMany({
      where: {
        candidateId: session.user.id
      },
      include: {
        session: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Déterminer si le candidat peut accéder aux quiz
    let canAccessQuizzes = false
    let interviewStatus = 'NONE' // NONE, SCHEDULED, IN_PROGRESS, COMPLETED, UNFAVORABLE

    if (interviews.length > 0) {
      // Prendre le dernier entretien
      const lastInterview = interviews[0]
      
      if (lastInterview.status === 'COMPLETED') {
        if (lastInterview.decision === 'DEFAVORABLE') {
          interviewStatus = 'UNFAVORABLE'
          canAccessQuizzes = false
        } else if (lastInterview.decision === 'FAVORABLE' || lastInterview.decision === 'A_SURVEILLER') {
          interviewStatus = 'COMPLETED'
          canAccessQuizzes = true
        } else {
          // Pas de décision encore prise
          interviewStatus = 'COMPLETED_NO_DECISION'
          canAccessQuizzes = false
        }
      } else if (lastInterview.status === 'IN_PROGRESS') {
        interviewStatus = 'IN_PROGRESS'
        canAccessQuizzes = false
      } else if (lastInterview.status === 'SCHEDULED') {
        interviewStatus = 'SCHEDULED'
        canAccessQuizzes = false
      }
    }

    return NextResponse.json({
      canAccessQuizzes,
      interviewStatus,
      lastInterview: interviews[0] || null,
      message: !canAccessQuizzes ? getStatusMessage(interviewStatus) : null
    })
  } catch (error) {
    console.error('Erreur lors de la récupération du statut d\'entretien:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

function getStatusMessage(status: string): string {
  switch (status) {
    case 'NONE':
      return 'Aucun entretien programmé. Veuillez vous inscrire à une session.'
    case 'SCHEDULED':
      return 'Votre entretien est programmé. Les quiz seront disponibles après votre entretien.'
    case 'IN_PROGRESS':
      return 'Votre entretien est en cours. Les quiz seront disponibles à la fin.'
    case 'COMPLETED_NO_DECISION':
      return 'Votre entretien est terminé mais aucune décision n\'a encore été prise.'
    case 'UNFAVORABLE':
      return 'L\'accès aux quiz n\'est pas autorisé suite à la décision d\'entretien.'
    default:
      return 'Statut d\'entretien inconnu.'
  }
}
