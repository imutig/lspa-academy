import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['DIRECTEUR', 'SUPERVISEUR', 'INSTRUCTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const randomCount = searchParams.get('random')

    if (randomCount) {
      // Récupérer des situations aléatoires pour les entretiens
      const count = parseInt(randomCount) || 3
      const situations = await prisma.$queryRaw`
        SELECT * FROM "Situation" 
        ORDER BY RANDOM() 
        LIMIT ${count}
      `
      return NextResponse.json({ situations })
    }

    // Récupérer toutes les situations (pour l'admin)
    const situations = await prisma.situation.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ situations })
  } catch (error) {
    console.error('Erreur lors de la récupération des situations:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['DIRECTEUR', 'SUPERVISEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const { title, description, expectedResponse, difficulty, category } = await request.json()

    if (!title || !description) {
      return NextResponse.json({ error: 'Les champs titre et description sont requis' }, { status: 400 })
    }

    const validDifficulties = ['FACILE', 'MOYEN', 'DIFFICILE']
    if (difficulty && !validDifficulties.includes(difficulty)) {
      return NextResponse.json({ error: 'Difficulté invalide' }, { status: 400 })
    }

    const situation = await prisma.situation.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        expectedResponse: expectedResponse?.trim() || null,
        difficulty: difficulty || 'MOYEN',
        category: category?.trim() || null,
        createdBy: session.user.id
      }
    })

    return NextResponse.json({ situation })
  } catch (error) {
    console.error('Erreur lors de la création de la situation:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
