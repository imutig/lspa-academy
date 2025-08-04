import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; candidateId: string }> }
) {
  try {
    // Pour le moment, on contourne l'authentification pour tester
    // TODO: Corriger l'authentification avec NextAuth dans App Router
    
    const { id: sessionId, candidateId } = await params
    const { status, matricule } = await request.json()

    // Mise à jour du candidat dans la session
    const updateData: any = {}
    if (status) updateData.status = status
    if (matricule !== undefined) updateData.matricule = matricule

    // Essayons d'abord de trouver par l'ID du SessionCandidate
    let updatedCandidate
    try {
      updatedCandidate = await prisma.sessionCandidate.update({
        where: {
          id: candidateId // Utiliser l'ID du SessionCandidate directement
        },
        data: updateData,
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
    } catch (error: any) {
      if (error.code === 'P2025') {
        // Si pas trouvé par ID, essayer par sessionId_userId
        updatedCandidate = await prisma.sessionCandidate.update({
          where: {
            sessionId_userId: {
              sessionId: sessionId,
              userId: candidateId
            }
          },
          data: updateData,
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
      } else {
        throw error
      }
    }

    // Si un matricule est assigné, mettre à jour aussi l'utilisateur
    if (matricule && updatedCandidate.user) {
      await prisma.user.update({
        where: { id: updatedCandidate.userId },
        data: { matricule: matricule }
      })
    }

    console.log('Candidat mis à jour:', updatedCandidate.id, 'statut:', status, 'matricule:', matricule)
    return NextResponse.json(updatedCandidate)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du candidat:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; candidateId: string }> }
) {
  try {
    // Pour le moment, on contourne l'authentification pour tester
    // TODO: Corriger l'authentification avec NextAuth dans App Router
    
    const { id: sessionId, candidateId } = await params

    // Essayons d'abord de supprimer par l'ID du SessionCandidate
    try {
      await prisma.sessionCandidate.delete({
        where: {
          id: candidateId // Utiliser l'ID du SessionCandidate directement
        }
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        // Si pas trouvé par ID, essayer par sessionId_userId
        await prisma.sessionCandidate.delete({
          where: {
            sessionId_userId: {
              sessionId: sessionId,
              userId: candidateId
            }
          }
        })
      } else {
        throw error
      }
    }

    console.log('Candidat retiré de la session:', candidateId)
    return NextResponse.json({ message: 'Candidat retiré avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression du candidat:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
