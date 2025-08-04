import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer les inscriptions du candidat
    const candidateRegistrations = await prisma.sessionCandidate.findMany({
      where: {
        userId: session.user.id,
        status: {
          in: ['REGISTERED', 'VALIDATED', 'QUIZ_READY']
        }
      },
      include: {
        session: {
          include: {
            sessionQuizzes: {
              where: {
                isActive: true
              },
              include: {
                quiz: true
              }
            }
          }
        }
      }
    })

    const notifications = []

    // Vérifier les quiz actifs pour les sessions du candidat
    for (const registration of candidateRegistrations) {
      for (const sessionQuiz of registration.session.sessionQuizzes) {
        // Vérifier si le candidat n'a pas encore fait ce quiz
        const existingAttempt = await prisma.quizAttempt.findUnique({
          where: {
            quizId_userId: {
              quizId: sessionQuiz.quizId,
              userId: session.user.id
            }
          }
        })

        if (!existingAttempt) {
          notifications.push({
            id: `quiz-${sessionQuiz.id}`,
            type: 'quiz',
            title: 'Nouveau Quiz Disponible',
            message: `Le quiz "${sessionQuiz.quiz.title}" est maintenant disponible pour la session "${registration.session.name}".`,
            sessionId: registration.sessionId,
            quizId: sessionQuiz.quizId,
            createdAt: sessionQuiz.createdAt
          })
        }
      }
    }

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
