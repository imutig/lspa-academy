import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Soumettre un quiz
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'CANDIDAT') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { quizId, answers, timeSpent, sessionId } = body

    if (!quizId || !sessionId) {
      return NextResponse.json({ error: 'Quiz ID et Session ID requis' }, { status: 400 })
    }

    // Récupérer le quiz avec les questions
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true }
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 })
    }

    // Vérifier si le candidat a déjà passé ce quiz
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId,
        userId: session.user.id
      }
    })

    if (existingAttempt) {
      return NextResponse.json({ error: 'Vous avez déjà passé ce quiz' }, { status: 400 })
    }

    // Calculer le score
    let totalPoints = 0
    let earnedPoints = 0

    const results = quiz.questions.map((question: any) => {
      const userAnswer = answers[question.id]
      const isCorrect = userAnswer === question.correctAnswer
      totalPoints += question.points
      if (isCorrect) {
        earnedPoints += question.points
      }

      return {
        questionId: question.id,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        points: isCorrect ? question.points : 0
      }
    })

    const scorePercentage = Math.round((earnedPoints / totalPoints) * 100)
    const passed = scorePercentage >= quiz.passingScore

    // Sauvegarder la tentative
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        userId: session.user.id,
        sessionId: sessionId || '',
        answers: answers,
        score: earnedPoints,
        maxScore: totalPoints,
        completed: true,
        completedAt: new Date()
      },
      include: {
        quiz: {
          select: {
            title: true,
            passingScore: true
          }
        }
      }
    })

    return NextResponse.json({
      attempt,
      results,
      summary: {
        totalQuestions: quiz.questions.length,
        correctAnswers: results.filter((r: any) => r.isCorrect).length,
        score: earnedPoints,
        maxScore: totalPoints,
        passed: earnedPoints >= (quiz.passingScoreNormal || 80)
      }
    })
  } catch (error) {
    console.error('Erreur lors de la soumission du quiz:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// GET - Récupérer les tentatives de quiz
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const quizId = searchParams.get('quizId')
    const candidateId = searchParams.get('candidateId')

    let whereClause: any = {}

    if (session.user.role === 'CANDIDAT') {
      whereClause.userId = session.user.id
    } else {
      if (candidateId) {
        whereClause.userId = candidateId
      }
    }

    if (quizId) {
      whereClause.quizId = quizId
    }

    const attempts = await prisma.quizAttempt.findMany({
      where: whereClause,
      include: {
        quiz: {
          select: {
            title: true,
            description: true,
            passingScoreNormal: true,
            passingScoreToWatch: true
          }
        },
        user: {
          select: {
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    })

    return NextResponse.json(attempts)
  } catch (error) {
    console.error('Erreur lors de la récupération des tentatives:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
