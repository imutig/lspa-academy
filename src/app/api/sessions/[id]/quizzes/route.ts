import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Récupérer les quiz affectés à une session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id: sessionId } = await params

    const sessionQuizzes = await prisma.sessionQuiz.findMany({
      where: { sessionId },
      include: {
        quiz: {
          include: {
            _count: {
              select: {
                questions: true,
                attempts: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(sessionQuizzes)
  } catch (error) {
    console.error('Erreur lors de la récupération des quiz de la session:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Affecter un quiz existant à une session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { id: sessionId } = await params
    const body = await request.json()
    const { quizId } = body

    // Validation
    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID requis' }, { status: 400 })
    }

    // Vérifier que la session existe
    const existingSession = await prisma.session.findUnique({
      where: { id: sessionId }
    })

    if (!existingSession) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 })
    }

    // Vérifier que le quiz existe
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: quizId }
    })

    if (!existingQuiz) {
      return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 })
    }

    // Vérifier que l'affectation n'existe pas déjà
    const existingAssignment = await prisma.sessionQuiz.findUnique({
      where: {
        sessionId_quizId: {
          sessionId,
          quizId
        }
      }
    })

    if (existingAssignment) {
      return NextResponse.json({ error: 'Ce quiz est déjà affecté à cette session' }, { status: 400 })
    }

    const sessionQuiz = await prisma.sessionQuiz.create({
      data: {
        sessionId,
        quizId,
        isActive: false
      },
      include: {
        quiz: {
          include: {
            _count: {
              select: { questions: true, attempts: true }
            }
          }
        }
      }
    })

    return NextResponse.json(sessionQuiz, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de l\'affectation du quiz:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
