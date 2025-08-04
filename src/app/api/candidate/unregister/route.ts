import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CANDIDAT') {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      )
    }

    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: "L'ID de la session est requis" },
        { status: 400 }
      )
    }

    // Vérifier que l'inscription existe
    const existingRegistration = await prisma.sessionCandidate.findUnique({
      where: {
        sessionId_userId: {
          sessionId: sessionId,
          userId: session.user.id
        }
      }
    })

    if (!existingRegistration) {
      return NextResponse.json(
        { error: "Vous n'êtes pas inscrit à cette session" },
        { status: 400 }
      )
    }

    // Vérifier que la session permet encore la désinscription
    const targetSession = await prisma.session.findUnique({
      where: { id: sessionId }
    })

    if (!targetSession) {
      return NextResponse.json(
        { error: "Session non trouvée" },
        { status: 404 }
      )
    }

    if (targetSession.status === 'ACTIVE' || targetSession.status === 'CLOSED') {
      return NextResponse.json(
        { error: "Impossible de se désinscrire d'une session active ou fermée" },
        { status: 400 }
      )
    }

    // Supprimer l'inscription
    await prisma.sessionCandidate.delete({
      where: {
        sessionId_userId: {
          sessionId: sessionId,
          userId: session.user.id
        }
      }
    })

    return NextResponse.json({
      message: "Désinscription réussie !",
      sessionId
    })

  } catch (error) {
    console.error("Erreur lors de la désinscription:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
