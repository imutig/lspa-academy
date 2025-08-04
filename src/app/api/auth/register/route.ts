import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { firstName, lastName, username, password, code } = await request.json()

    // Validation des données
    if (!firstName || !lastName || !username || !password || !code) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    // Validation du mot de passe
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    // Vérifier le code d'inscription
    const registrationCode = await prisma.registrationCode.findUnique({
      where: { code: code.toUpperCase() }
    })

    if (!registrationCode || !registrationCode.isActive) {
      return NextResponse.json(
        { error: 'Code d\'inscription invalide ou inactif' },
        { status: 400 }
      )
    }

    // Vérifier la limite d'usage
    if (registrationCode.usageLimit !== null && registrationCode.usedCount >= registrationCode.usageLimit) {
      return NextResponse.json(
        { error: 'Ce code d\'inscription a atteint sa limite d\'usage' },
        { status: 400 }
      )
    }

    // Vérifier si le nom d'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ce nom d\'utilisateur est déjà utilisé' },
        { status: 400 }
      )
    }

    // Hasher le mot de passe fourni par l'utilisateur
    const hashedPassword = await bcrypt.hash(password, 12)

    // Créer l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
        email: null, // Pas d'email requis
        password: hashedPassword,
        role: 'CANDIDAT'
      }
    })

    // Incrémenter le compteur d'usage du code
    await prisma.registrationCode.update({
      where: { id: registrationCode.id },
      data: {
        currentUses: {
          increment: 1
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Compte créé avec succès',
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        username: newUser.username
      }
    })

  } catch (error) {
    console.error('Erreur lors de la création du compte:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
