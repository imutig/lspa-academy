import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Code d\'inscription requis' },
        { status: 400 }
      )
    }

    // Rechercher le code d'inscription
    const registrationCode = await prisma.registrationCode.findUnique({
      where: { code: code.toUpperCase() }
    })

    if (!registrationCode) {
      return NextResponse.json(
        { error: 'Code d\'inscription invalide' },
        { status: 404 }
      )
    }

    // Vérifier si le code est encore actif
    if (!registrationCode.isActive) {
      return NextResponse.json(
        { error: 'Ce code d\'inscription n\'est plus actif' },
        { status: 403 }
      )
    }

    // Vérifier la limite d'usage si elle existe
    if (registrationCode.usageLimit !== null && registrationCode.usedCount >= registrationCode.usageLimit) {
      return NextResponse.json(
        { error: 'Ce code d\'inscription a atteint sa limite d\'usage' },
        { status: 403 }
      )
    }

    // Le code est valide
    return NextResponse.json({
      valid: true,
      message: 'Code d\'inscription valide'
    })

  } catch (error) {
    console.error('Erreur lors de la validation du code:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
