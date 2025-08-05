import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Vérifier que l'utilisateur a les droits admin
    if (!['DIRECTEUR', 'SUPERVISEUR', 'INSTRUCTEUR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Droits insuffisants' },
        { status: 403 }
      )
    }

    const url = new URL(request.url)
    const candidateId = url.searchParams.get('candidateId')
    const quizId = url.searchParams.get('quizId')

    if (!candidateId || !quizId) {
      return NextResponse.json(
        { error: 'candidateId et quizId requis' },
        { status: 400 }
      )
    }

    // Supprimer toutes les tentatives de quiz pour ce candidat
    const deletedAttempts = await prisma.quizAttempt.deleteMany({
      where: {
        userId: candidateId,
        quizId: quizId
      }
    })

    console.log(`Quiz reset: ${deletedAttempts.count} tentatives supprimées pour candidat ${candidateId}, quiz ${quizId}`)

    return NextResponse.json({ 
      success: true, 
      deletedCount: deletedAttempts.count,
      message: `${deletedAttempts.count} tentative(s) supprimée(s)` 
    })
  } catch (error) {
    console.error('Erreur lors du reset du quiz:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
