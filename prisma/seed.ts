import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    // Vérifier si l'admin existe déjà
    const existingAdmin = await prisma.user.findUnique({
      where: { email: process.env.ADMIN_EMAIL || 'admin@lspa.local' }
    })

    if (existingAdmin) {
      console.log('Utilisateur admin existe déjà')
      return
    }

    // Créer l'utilisateur admin
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12)
    
    const admin = await prisma.user.create({
      data: {
        email: process.env.ADMIN_EMAIL || 'admin@lspa.local',
        username: 'admin',
        password: hashedPassword,
        role: 'DIRECTEUR',
      }
    })

    console.log('Utilisateur admin créé:', admin.email)

    // Créer une session de test
    const testSession = await prisma.session.create({
      data: {
        name: 'Session Test - Police Academy',
        description: 'Session de test pour la démonstration du système',
        status: 'PLANNED',
        createdBy: admin.id,
      }
    })

    console.log('Session de test créée:', testSession.name)

  } catch (error) {
    console.error('Erreur lors du seed:', error)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
