import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
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

    // Vérifier que la session existe et est planifiée
    const targetSession = await prisma.session.findUnique({
      where: { id: sessionId }
    })

    if (!targetSession) {
      return NextResponse.json(
        { error: "Session non trouvée" },
        { status: 404 }
      )
    }

    if (targetSession.status !== 'PLANNED') {
      return NextResponse.json(
        { error: "Cette session n'accepte plus d'inscriptions" },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur n'est pas déjà inscrit
    const existingRegistration = await prisma.sessionCandidate.findUnique({
      where: {
        sessionId_userId: {
          sessionId: sessionId,
          userId: session.user.id
        }
      }
    })

    if (existingRegistration) {
      return NextResponse.json(
        { error: "Vous êtes déjà inscrit à cette session" },
        { status: 400 }
      )
    }

    // Inscrire le candidat
    const registration = await prisma.sessionCandidate.create({
      data: {
        sessionId: sessionId,
        userId: session.user.id,
        status: "REGISTERED"
      }
    })

    return NextResponse.json({
      message: "Inscription réussie !",
      registration
    })

  } catch (error) {
    console.error("Erreur lors de l'inscription:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
