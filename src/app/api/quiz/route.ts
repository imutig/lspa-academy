import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Récupérer les quiz
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const quizId = searchParams.get('id')
    const sessionId = searchParams.get('sessionId')
    const includeQuestions = searchParams.get('includeQuestions') === 'true'

    if (quizId) {
      // Récupérer un quiz spécifique
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          questions: includeQuestions,
          attempts: session.user.role === 'CANDIDAT' ? {
            where: { userId: session.user.id },
            orderBy: { startedAt: 'desc' },
            take: 1
          } : {
            include: {
              user: {
                select: { username: true, email: true }
              }
            },
            orderBy: { startedAt: 'desc' }
          }
        }
      })

      if (!quiz) {
        return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 })
      }

      return NextResponse.json(quiz)
    } else {
      // Récupérer tous les quiz
      const quiz = await prisma.quiz.findMany({
        include: {
          _count: {
            select: {
              questions: true,
              attempts: true,
              sessionQuizzes: true
            }
          },
          sessionQuizzes: {
            include: {
              session: {
                select: { name: true }
              }
            }
          },
          attempts: session.user.role === 'CANDIDAT' ? {
            where: { userId: session.user.id },
            orderBy: { startedAt: 'desc' },
            take: 1
          } : false
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json(quiz)
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des quiz:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer un nouveau quiz (superviseurs+)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, timeLimit, passingScoreNormal, passingScoreToWatch, questions } = body

    // Validation
    if (!title) {
      return NextResponse.json({ error: 'Le titre est requis' }, { status: 400 })
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        timeLimit: timeLimit ? parseInt(timeLimit) : 600,
        passingScoreNormal: passingScoreNormal ? parseInt(passingScoreNormal) : 80,
        passingScoreToWatch: passingScoreToWatch ? parseInt(passingScoreToWatch) : 90,
        questions: questions ? {
          create: questions.map((q: any, index: number) => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            points: q.points || 1,
            order: index + 1
          }))
        } : undefined
      },
      include: {
        _count: {
          select: { questions: true, attempts: true }
        }
      }
    })

    return NextResponse.json(quiz, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du quiz:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour un quiz
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['INSTRUCTEUR', 'SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { id, title, description, timeLimit, passingScore, isActive } = body

    const quiz = await prisma.quiz.update({
      where: { id },
      data: {
        title,
        description,
        timeLimit: timeLimit ? parseInt(timeLimit) : null,
        passingScore: passingScore ? parseInt(passingScore) : undefined,
        isActive
      },
      include: {
        questions: true,
        _count: {
          select: { questions: true, attempts: true }
        }
      }
    })

    return NextResponse.json(quiz)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du quiz:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
