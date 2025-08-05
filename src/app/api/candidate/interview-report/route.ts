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

    // Récupérer l'entretien terminé du candidat
    const interview = await prisma.interview.findFirst({
      where: {
        candidateId: session.user.id,
        status: 'COMPLETED'
      },
      include: {
        session: {
          select: {
            id: true,
            name: true
          }
        },
        interviewer: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        interviewQuestions: {
          include: {
            question: true
          }
        },
        interviewSituations: {
          include: {
            situation: true
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    })

    if (!interview) {
      return NextResponse.json({ error: 'Aucun entretien terminé trouvé' }, { status: 404 })
    }

    return NextResponse.json({
      interview: {
        id: interview.id,
        status: interview.status,
        decision: interview.decision,
        notes: interview.notes,
        conductedBy: interview.conductedBy,
        interviewer: interview.interviewer ? {
          name: interview.interviewer.firstName && interview.interviewer.lastName 
            ? `${interview.interviewer.firstName} ${interview.interviewer.lastName}`
            : interview.interviewer.username,
          email: interview.interviewer.email
        } : null,
        completedAt: interview.completedAt,
        session: interview.session,
        questions: interview.interviewQuestions.map(iq => ({
          id: iq.id,
          question: iq.question.question,
          candidateAnswer: iq.answer,
          rating: iq.rating,
          category: iq.question.category
        })),
        situations: interview.interviewSituations.map(is => ({
          id: is.id,
          situation: is.situation.title,
          description: is.situation.description,
          candidateAnswer: is.candidateResponse,
          evaluation: is.evaluation,
          category: is.situation.category
        }))
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération du compte-rendu d\'entretien:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
