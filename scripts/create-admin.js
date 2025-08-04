const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@lspa.com',
        username: 'admin',
        password: hashedPassword,
        role: 'DIRECTEUR'
      }
    })
    
    console.log('Administrateur créé:', admin)
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('Un utilisateur avec cet email ou username existe déjà')
    } else {
      console.error('Erreur:', error)
    }
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
