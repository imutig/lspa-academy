import { prisma } from './src/lib/prisma.js'
import bcrypt from 'bcryptjs'

async function createTestUsers() {
  try {
    console.log('=== Création d\'utilisateurs de test ===')
    
    // Vérifier s'il y a déjà des utilisateurs
    const existingUsers = await prisma.user.count()
    if (existingUsers > 0) {
      console.log('Des utilisateurs existent déjà. Suppression...')
      await prisma.sessionCandidate.deleteMany()
      await prisma.user.deleteMany()
    }
    
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    // Créer des utilisateurs de test
    const users = [
      {
        username: 'admin',
        email: 'admin@lspa.fr',
        password: hashedPassword,
        role: 'DIRECTEUR'
      },
      {
        username: 'candidat1',
        email: 'candidat1@lspa.fr',
        password: hashedPassword,
        role: 'CANDIDAT'
      },
      {
        username: 'candidat2',
        email: 'candidat2@lspa.fr',
        password: hashedPassword,
        role: 'CANDIDAT'
      },
      {
        username: 'instructeur',
        email: 'instructeur@lspa.fr',
        password: hashedPassword,
        role: 'INSTRUCTEUR'
      }
    ]
    
    for (const userData of users) {
      const user = await prisma.user.create({
        data: userData
      })
      console.log(`✓ Utilisateur créé: ${user.username} (${user.email}) - ${user.role}`)
    }
    
    console.log('\n=== Utilisateurs créés avec succès ===')
    console.log('Mot de passe pour tous: password123')
    
  } catch (error) {
    console.error('Erreur lors de la création des utilisateurs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUsers()
