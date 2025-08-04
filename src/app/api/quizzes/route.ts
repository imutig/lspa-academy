import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Récupérer tous les quizzes disponibles
    const quizzes = await prisma.quiz.findMany({
      include: {
        questions: true,
        sessionQuizzes: {
          include: {
            session: {
              select: {
                id: true,
                name: true,
                status: true
              }
            }
          }
        }
      },
      orderBy: {
        title: 'asc'
      }
    })

    // Formater les données pour l'API
    const formattedQuizzes = quizzes.map(quiz => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      timeLimit: quiz.timeLimit,
      passingScoreNormal: quiz.passingScoreNormal,
      passingScoreToWatch: quiz.passingScoreToWatch,
      questionCount: quiz.questions.length,
      sessions: quiz.sessionQuizzes.map(sq => ({
        id: sq.session.id,
        name: sq.session.name,
        status: sq.session.status,
        isActive: sq.isActive
      })),
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt
    }))

    return NextResponse.json(formattedQuizzes)

  } catch (error) {
    console.error('Erreur lors de la récupération des quizzes:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des quizzes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Vérifier que l'utilisateur a les droits pour créer des quizzes
    if (!['DIRECTEUR', 'INSTRUCTEUR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Droits insuffisants pour créer un quiz' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, description, timeLimit, passingScoreNormal, passingScoreToWatch, questions } = body

    // Validation des données
    if (!title || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'Titre et questions sont requis' },
        { status: 400 }
      )
    }

    // Créer le quiz avec ses questions
    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        timeLimit: timeLimit || 600,
        passingScoreNormal: passingScoreNormal || 80,
        passingScoreToWatch: passingScoreToWatch || 90,
        questions: {
          create: questions.map((q: any, index: number) => ({
            question: q.question,
            category: 'QUIZ',
            options: q.options ? JSON.stringify(q.options) : null,
            correctAnswer: q.correctAnswer,
            points: q.points || 1,
            order: index
          }))
        }
      },
      include: {
        questions: true
      }
    })

    return NextResponse.json(quiz, { status: 201 })

  } catch (error) {
    console.error('Erreur lors de la création du quiz:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création du quiz' },
      { status: 500 }
    )
  }
}
