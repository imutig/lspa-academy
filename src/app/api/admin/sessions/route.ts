import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'DIRECTEUR' && session.user.role !== 'SUPERVISEUR')) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      )
    }

    const { name, description } = await request.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom de la session est requis" },
        { status: 400 }
      )
    }

    const newSession = await prisma.session.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        status: "PLANNED",
        createdBy: session.user.id,
      }
    })

    return NextResponse.json({
      message: "Session créée avec succès",
      session: newSession
    })

  } catch (error) {
    console.error("Erreur lors de la création de la session:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    const sessions = await prisma.session.findMany({
      include: {
        _count: {
          select: { candidates: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ sessions })

  } catch (error) {
    console.error("Erreur lors de la récupération des sessions:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
