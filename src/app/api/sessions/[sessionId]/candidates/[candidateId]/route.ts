import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH - Mettre à jour le statut d'un candidat
export async function PATCH(
  request: NextRequest,
  { params }: { params: { sessionId: string; candidateId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier les permissions
    if (!['INSTRUCTEUR', 'SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const { status } = await request.json()

    // Valider le statut
    const validStatuses = [
      'REGISTERED', 'VALIDATED', 'IN_INTERVIEW', 'INTERVIEWED', 
      'QUIZ_READY', 'QUIZ_COMPLETED', 'PASSED', 'FAILED'
    ]
    
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    }

    // Mettre à jour le candidat
    const updatedCandidate = await prisma.sessionCandidate.update({
      where: {
        id: params.candidateId
      },
      data: {
        status
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            matricule: true
          }
        }
      }
    })

    return NextResponse.json(updatedCandidate)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du candidat:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
