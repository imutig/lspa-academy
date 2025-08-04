import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Récupérer les mises en situation
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['INSTRUCTEUR', 'SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const randomCount = searchParams.get('random')

    if (randomCount) {
      // Récupérer un nombre aléatoire de situations
      const count = parseInt(randomCount, 10)
      const totalSituations = await prisma.situation.count()
      
      if (count >= totalSituations) {
        // Si on demande plus de situations qu'il n'y en a, retourner toutes
        const allSituations = await prisma.situation.findMany({
          orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(allSituations)
      }

      // Récupérer des situations aléatoires
      const situations = await prisma.situation.findMany()
      const shuffled = situations.sort(() => 0.5 - Math.random())
      const selected = shuffled.slice(0, count)
      
      return NextResponse.json(selected)
    }

    const situations = await prisma.situation.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(situations)
  } catch (error) {
    console.error('Erreur lors de la récupération des situations:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer une mise en situation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['INSTRUCTEUR', 'SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { title, description, expectedBehavior, correctAnswer } = await request.json()

    if (!title || !description) {
      return NextResponse.json({ error: 'Titre et description requis' }, { status: 400 })
    }

    const situation = await prisma.situation.create({
      data: {
        title,
        description,
        expectedBehavior: expectedBehavior || '',
        correctAnswer: correctAnswer || '',
        createdBy: session.user.id
      }
    })

    return NextResponse.json(situation)
  } catch (error) {
    console.error('Erreur lors de la création de la situation:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer une mise en situation
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    await prisma.situation.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Situation supprimée avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression de la situation:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
