import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Initialisation de la base de données...')

  // Créer un utilisateur admin par défaut
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { username: 'administrateur.lspa' },
    update: {},
    create: {
      username: 'administrateur.lspa',
      firstName: 'Administrateur',
      lastName: 'LSPA',
      email: 'admin@lspa.com',
      password: hashedPassword,
      role: 'DIRECTEUR',
      matricule: 'ADM001'
    }
  })

  // Créer un code d'inscription par défaut
  await prisma.registrationCode.upsert({
    where: { code: 'LSPA2025' },
    update: {},
    create: {
      code: 'LSPA2025',
      description: 'Code d\'inscription par défaut',
      maxUses: 100,
      currentUses: 0,
      isActive: true,
      createdBy: admin.id
    }
  })

  // Créer quelques questions d'entretien par défaut
  const questions = [
    {
      id: 'q1',
      question: 'Pourquoi souhaitez-vous rejoindre le domaine de l\'aviation ?',
      category: 'INTERVIEW',
      points: 5
    },
    {
      id: 'q2',
      question: 'Comment gérez-vous le stress et la pression ?',
      category: 'INTERVIEW',
      points: 4
    },
    {
      id: 'q3',
      question: 'Décrivez une situation où vous avez fait preuve de leadership.',
      category: 'INTERVIEW',
      points: 3
    }
  ]

  for (const question of questions) {
    await prisma.question.upsert({
      where: { id: question.id },
      update: {},
      create: question
    })
  }

  // Créer quelques situations d'entretien
  const situations = [
    {
      id: 's1',
      title: 'Gestion d\'urgence',
      description: 'Vous êtes en vol et un voyant rouge s\'allume sur le tableau de bord. Comment réagissez-vous ?',
      expectedBehavior: 'Calme, procédures, communication',
      expectedResponse: 'Application stricte des procédures d\'urgence, communication avec le contrôle',
      difficulty: 'HARD',
      category: 'SECURITE',
      createdBy: admin.id
    },
    {
      id: 's2',
      title: 'Travail en équipe',
      description: 'Comment travaillez-vous avec votre co-pilote lors d\'un vol ?',
      expectedBehavior: 'Communication, coordination, respect des rôles',
      expectedResponse: 'Communication claire, respect de la hiérarchie, travail collaboratif',
      difficulty: 'MEDIUM',
      category: 'TEAMWORK',
      createdBy: admin.id
    },
    {
      id: 's3',
      title: 'Prise de décision',
      description: 'Les conditions météo se dégradent. Continuez-vous le vol ou faites-vous demi-tour ?',
      expectedBehavior: 'Analyse, prudence, sécurité avant tout',
      expectedResponse: 'Évaluation des risques, priorité à la sécurité, décision réfléchie',
      difficulty: 'HARD',
      category: 'DECISION',
      createdBy: admin.id
    }
  ]

  for (const situation of situations) {
    await prisma.situation.upsert({
      where: { id: situation.id },
      update: {},
      create: situation
    })
  }

  console.log('✅ Base de données initialisée avec succès !')
  console.log('👤 Admin créé : administrateur.lspa / admin123')
  console.log('🎫 Code d\'inscription : LSPA2025')
  console.log(`📝 ${questions.length} questions d'entretien créées`)
  console.log(`🎭 ${situations.length} situations d'entretien créées`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de l\'initialisation:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
