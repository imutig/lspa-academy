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

    if (session.user.role !== 'CANDIDAT') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Récupérer les sessions du candidat avec les quiz actifs
    const candidateRegistrations = await prisma.sessionCandidate.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        session: {
          include: {
            sessionQuizzes: {
              where: {
                isActive: true
              },
              include: {
                quiz: {
                  include: {
                    _count: {
                      select: {
                        questions: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    const availableQuizzes = []

    // Pour chaque inscription, vérifier les quiz disponibles
    for (const registration of candidateRegistrations) {
      for (const sessionQuiz of registration.session.sessionQuizzes) {
        // Vérifier si le candidat a déjà fait ce quiz
        const existingAttempt = await prisma.quizAttempt.findUnique({
          where: {
            quizId_userId: {
              quizId: sessionQuiz.quizId,
              userId: session.user.id
            }
          }
        })

        const quiz = {
          id: sessionQuiz.quiz.id,
          title: sessionQuiz.quiz.title,
          description: sessionQuiz.quiz.description,
          timeLimit: sessionQuiz.quiz.timeLimit,
          passingScore: sessionQuiz.quiz.passingScoreNormal,
          sessionName: registration.session.name,
          sessionId: registration.session.id,
          isActive: true,
          hasAttempt: !!existingAttempt,
          attemptScore: existingAttempt?.score,
          attemptPassed: existingAttempt ? existingAttempt.score >= sessionQuiz.quiz.passingScoreNormal : false,
          _count: sessionQuiz.quiz._count,
          questions: [] // Ne pas inclure les questions dans la liste
        }

        availableQuizzes.push(quiz)
      }
    }

    return NextResponse.json(availableQuizzes)
  } catch (error) {
    console.error('Erreur lors de la récupération des quiz:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
