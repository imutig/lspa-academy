import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const attemptId = searchParams.get('attemptId')

    if (!attemptId) {
      return NextResponse.json({ error: 'ID de tentative requis' }, { status: 400 })
    }

    // Récupérer la tentative de quiz avec les réponses
    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        id: attemptId,
        // Vérifier que c'est soit le candidat lui-même, soit un admin
        OR: [
          { userId: session.user.id },
          { user: { role: 'ADMIN' as any } }
        ]
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            description: true,
            timeLimit: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Tentative de quiz non trouvée' }, { status: 404 })
    }

    // Récupérer les questions du quiz avec les réponses stockées
    const quiz = await prisma.quiz.findFirst({
      where: { id: attempt.quizId },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 })
    }

    // Parser les réponses JSON
    const userAnswers = attempt.answers as any || {}
    
    // Formater les réponses
    const formattedAnswers = quiz.questions.map(question => {
      const options = question.options ? JSON.parse(question.options) : []
      const userAnswerIndex = parseInt(userAnswers[question.id] || '-1')
      const correctAnswerIndex = parseInt(question.correctAnswer || '0')
      const isCorrect = userAnswerIndex === correctAnswerIndex
      
      return {
        questionId: question.id,
        question: question.question,
        category: question.category,
        options: options,
        userAnswer: {
          index: userAnswerIndex,
          text: userAnswerIndex >= 0 ? (options[userAnswerIndex] || 'Réponse invalide') : 'Pas de réponse'
        },
        correctAnswer: {
          index: correctAnswerIndex,
          text: options[correctAnswerIndex] || 'Réponse invalide'
        },
        isCorrect: isCorrect,
        points: question.points,
        pointsEarned: isCorrect ? question.points : 0
      }
    })

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
        score: attempt.score,
        maxScore: attempt.maxScore,
        completed: attempt.completed,
        quiz: attempt.quiz,
        user: attempt.user,
        answers: formattedAnswers,
        summary: {
          totalQuestions: formattedAnswers.length,
          correctAnswers: formattedAnswers.filter((a: any) => a.isCorrect).length,
          totalPoints: formattedAnswers.reduce((sum: number, a: any) => sum + a.points, 0),
          earnedPoints: formattedAnswers.reduce((sum: number, a: any) => sum + a.pointsEarned, 0),
          percentage: attempt.score
        }
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des réponses du quiz:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
