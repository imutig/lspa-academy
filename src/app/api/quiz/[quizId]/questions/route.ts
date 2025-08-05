import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{
    quizId: string
  }>
}

// GET - Récupérer les questions d'un quiz
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { quizId } = await params

    const questions = await prisma.question.findMany({
      where: {
        quizId: quizId
      },
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json(questions)
  } catch (error) {
    console.error('Erreur lors de la récupération des questions:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle question
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const { quizId } = await params;
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier les permissions
    if (!['SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const { question, options, correctAnswer, points, order } = await request.json()

    // Validation
    if (!question || !correctAnswer) {
      return NextResponse.json({ error: 'Question et réponse correcte sont requises' }, { status: 400 })
    }

    // Vérifier que le quiz existe
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId }
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 })
    }

    const newQuestion = await prisma.question.create({
      data: {
        quizId: quizId,
        question,
        options,
        correctAnswer,
        points: points || 1,
        order: order || 1
      }
    })

    return NextResponse.json(newQuestion, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de la question:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
