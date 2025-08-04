import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtenir les détails d'une session avec les quiz actifs
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['INSTRUCTEUR', 'SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { id: sessionId } = await params

    // Récupérer les détails de la session
    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        sessionQuizzes: {
          include: {
            quiz: {
              select: {
                id: true,
                title: true,
                description: true,
                timeLimit: true
              }
            }
          }
        }
      }
    })

    if (!sessionData) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 })
    }

    return NextResponse.json(sessionData)
  } catch (error) {
    console.error('Erreur lors de la récupération de la session:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
