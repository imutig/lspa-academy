import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['INSTRUCTEUR', 'SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const { userId, matricule } = await request.json()

    if (!userId || !matricule) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Vérifier que le matricule n'existe pas déjà
    const existingUser = await prisma.user.findFirst({
      where: { 
        matricule: matricule,
        id: { not: userId }
      }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Ce matricule est déjà attribué' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { matricule: matricule },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        matricule: true,
      }
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Erreur lors de l\'attribution du matricule:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['INSTRUCTEUR', 'SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    // Récupérer tous les candidats avec ou sans matricule
    const candidates = await prisma.user.findMany({
      where: { role: 'CANDIDAT' },
      select: {
        id: true,
        username: true,
        email: true,
        matricule: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ candidates })
  } catch (error) {
    console.error('Erreur lors de la récupération des candidats:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
