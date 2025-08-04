import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Récupérer les codes d'inscription
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const codes = await prisma.registrationCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true }
        }
      }
    })

    return NextResponse.json(codes)
  } catch (error) {
    console.error('Erreur lors de la récupération des codes:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer un code d'inscription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['SUPERVISEUR', 'DIRECTEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { code, maxUses, description } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Code requis' }, { status: 400 })
    }

    // Vérifier si le code existe déjà
    const existingCode = await prisma.registrationCode.findUnique({
      where: { code }
    })

    if (existingCode) {
      return NextResponse.json({ error: 'Ce code existe déjà' }, { status: 400 })
    }

    const registrationCode = await prisma.registrationCode.create({
      data: {
        code,
        maxUses: maxUses || null, // null = illimité
        description: description || '',
        createdBy: session.user.id
      }
    })

    return NextResponse.json(registrationCode)
  } catch (error) {
    console.error('Erreur lors de la création du code:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer un code d'inscription
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

    await prisma.registrationCode.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Code supprimé avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression du code:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
