import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CANDIDAT') {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      )
    }

    // Récupérer les sessions auxquelles le candidat participe
    const candidateSessions = await prisma.sessionCandidate.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        session: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Récupérer les sessions disponibles (planifiées et pas encore inscrit)
    const availableSessions = await prisma.session.findMany({
      where: {
        status: 'PLANNED',
        candidates: {
          none: {
            userId: session.user.id
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      candidateSessions,
      availableSessions
    })

  } catch (error) {
    console.error("Erreur lors de la récupération des sessions:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
