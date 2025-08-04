import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    if (!['DIRECTEUR', 'SUPERVISEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Récupérer les questions d'entretien depuis la base de données
    const questions = await prisma.question.findMany({
      where: {
        category: 'INTERVIEW'
      },
      select: {
        id: true,
        question: true,
        category: true,
        points: true
      },
      orderBy: {
        points: 'desc'
      }
    })

    return NextResponse.json(questions)
  } catch (error) {
    console.error('Erreur lors de la récupération des questions:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
