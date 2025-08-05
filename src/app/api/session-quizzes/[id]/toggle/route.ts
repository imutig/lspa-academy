import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { isActive } = await request.json()
    const resolvedParams = await params
    const sessionQuizId = resolvedParams.id

    // Mettre à jour le statut d'activation du quiz
    const updatedSessionQuiz = await prisma.sessionQuiz.update({
      where: { id: sessionQuizId },
      data: { isActive },
      include: {
        quiz: {
          select: {
            title: true,
            _count: {
              select: {
                questions: true
              }
            }
          }
        },
        session: {
          select: {
            name: true
          }
        }
      }
    })

    console.log(`Quiz ${isActive ? 'activé' : 'désactivé'}:`, {
      quiz: updatedSessionQuiz.quiz.title,
      session: updatedSessionQuiz.session.name,
      isActive
    })

    return NextResponse.json({
      success: true,
      message: `Quiz ${isActive ? 'activé' : 'désactivé'} avec succès`,
      sessionQuiz: updatedSessionQuiz
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut du quiz:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour' },
      { status: 500 }
    )
  }
}
