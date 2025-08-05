import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Vérifier que l'utilisateur a les droits pour gérer les quiz
    if (!['DIRECTEUR', 'SUPERVISEUR', 'INSTRUCTEUR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Droits insuffisants' },
        { status: 403 }
      )
    }

    const sessionQuizId = params.id

    // Récupérer les infos avant suppression pour le log
    const sessionQuiz = await prisma.sessionQuiz.findUnique({
      where: { id: sessionQuizId },
      include: {
        quiz: {
          select: {
            title: true
          }
        },
        session: {
          select: {
            name: true
          }
        }
      }
    })

    if (!sessionQuiz) {
      return NextResponse.json(
        { error: 'Quiz de session non trouvé' },
        { status: 404 }
      )
    }

    // Supprimer le quiz de la session
    await prisma.sessionQuiz.delete({
      where: { id: sessionQuizId }
    })

    console.log(`Quiz retiré de la session:`, {
      quiz: sessionQuiz.quiz.title,
      session: sessionQuiz.session.name
    })

    return NextResponse.json({
      success: true,
      message: 'Quiz retiré de la session avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la suppression du quiz de session:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression' },
      { status: 500 }
    )
  }
}
