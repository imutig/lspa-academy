import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    if (!['DIRECTEUR', 'SUPERVISEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { question, category } = await request.json()

    if (!question?.trim()) {
      return NextResponse.json({ error: 'La question est requise' }, { status: 400 })
    }

    // Mettre à jour la question d'entretien
    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        question: question.trim(),
        category: 'INTERVIEW',
        points: 1 // Valeur par défaut
      }
    })

    return NextResponse.json(updatedQuestion)
  } catch (error) {
    console.error('Erreur lors de la modification de la question:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    if (!['DIRECTEUR', 'SUPERVISEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Supprimer la question d'entretien
    await prisma.question.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Question supprimée avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression de la question:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
