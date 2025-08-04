import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['DIRECTEUR', 'SUPERVISEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const { title, description, scenario, expectedResponse, difficulty, category, isActive } = await request.json()

    if (!title || !description || !scenario) {
      return NextResponse.json({ error: 'Les champs titre, description et scénario sont requis' }, { status: 400 })
    }

    const validDifficulties = ['FACILE', 'MOYEN', 'DIFFICILE']
    if (difficulty && !validDifficulties.includes(difficulty)) {
      return NextResponse.json({ error: 'Difficulté invalide' }, { status: 400 })
    }

    const situation = await prisma.situation.update({
      where: { id: params.id },
      data: {
        title: title.trim(),
        description: description.trim(),
        scenario: scenario.trim(),
        expectedResponse: expectedResponse?.trim() || null,
        difficulty: difficulty || 'MOYEN',
        category: category?.trim() || null,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json({ situation })
  } catch (error) {
    console.error('Erreur lors de la modification de la situation:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['DIRECTEUR', 'SUPERVISEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    await prisma.situation.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Situation supprimée avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression de la situation:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
