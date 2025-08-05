import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const { quizId } = await params;
  
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 })
    }

    return NextResponse.json(quiz)
  } catch (error) {
    console.error('Erreur lors de la récupération du quiz:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour un quiz
export async function PATCH(
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

    const body = await request.json()
    const { title, description, timeLimit, passingScoreNormal, passingScoreToWatch, isActive } = body

    // Vérifier que le quiz existe
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: quizId }
    })

    if (!existingQuiz) {
      return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 })
    }

    const updatedQuiz = await prisma.quiz.update({
      where: { id: quizId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(timeLimit && { timeLimit: parseInt(timeLimit) }),
        ...(passingScoreNormal && { passingScoreNormal: parseInt(passingScoreNormal) }),
        ...(passingScoreToWatch && { passingScoreToWatch: parseInt(passingScoreToWatch) }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        _count: {
          select: { questions: true, attempts: true }
        }
      }
    })

    return NextResponse.json(updatedQuiz)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du quiz:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un quiz
export async function DELETE(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier les permissions
    if (!['SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    // Vérifier que le quiz existe
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: params.quizId }
    })

    if (!existingQuiz) {
      return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 })
    }

    await prisma.quiz.delete({
      where: { id: params.quizId }
    })

    return NextResponse.json({ message: 'Quiz supprimé avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression du quiz:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
