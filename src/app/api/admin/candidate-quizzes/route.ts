import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const candidateId = searchParams.get('candidateId')
    const sessionId = searchParams.get('sessionId')

    if (!candidateId || !sessionId) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    // Récupérer les tentatives de quiz du candidat pour cette session
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId: candidateId,
        // Filtrer par les quiz assignés à cette session
        quiz: {
          sessionQuizzes: {
            some: {
              sessionId: sessionId
            }
          }
        }
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            description: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    })

    return NextResponse.json({
      attempts: quizAttempts,
      candidate: quizAttempts[0]?.user || null
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des quiz du candidat:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
