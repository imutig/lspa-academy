import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE - Reset le quiz d'un candidat (pour les instructeurs)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['INSTRUCTEUR', 'SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const candidateId = searchParams.get('candidateId')
    const quizId = searchParams.get('quizId')

    if (!candidateId || !quizId) {
      return NextResponse.json({ error: 'Candidate ID et Quiz ID requis' }, { status: 400 })
    }

    // Supprimer toutes les tentatives de ce candidat pour ce quiz
    await prisma.quizAttempt.deleteMany({
      where: {
        userId: candidateId,
        quizId: quizId
      }
    })

    // Supprimer le progrès sauvegardé
    await prisma.quizAttempt.deleteMany({
      where: {
        userId: candidateId,
        quizId: quizId,
        completed: false
      }
    })

    return NextResponse.json({ success: true, message: 'Quiz reseté avec succès' })
  } catch (error) {
    console.error('Erreur lors du reset du quiz:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour le matricule d'un candidat
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['INSTRUCTEUR', 'SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { candidateId, sessionId, matricule, status } = body

    if (!candidateId || !sessionId) {
      return NextResponse.json({ error: 'Candidate ID et Session ID requis' }, { status: 400 })
    }

    // Mettre à jour les informations du candidat dans la session
    const updatedCandidate = await prisma.sessionCandidate.update({
      where: {
        sessionId_userId: {
          sessionId: sessionId,
          userId: candidateId
        }
      },
      data: {
        ...(matricule !== undefined && { matricule }),
        ...(status !== undefined && { status })
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(updatedCandidate)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du candidat:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
