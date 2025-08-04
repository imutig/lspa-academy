import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createAdminCode() {
  try {
    // Créer un code admin par défaut
    const adminCode = await prisma.registrationCode.create({
      data: {
        code: 'ADMIN_ACCESS',
        description: 'Code d\'accès administrateur - utilisations illimitées',
        maxUses: null, // illimité
        createdBy: 'system'
      }
    })

    console.log('Code admin créé:', adminCode)

    // Créer quelques mises en situation par défaut
    const situations = [
      {
        title: 'Gestion de conflit',
        description: 'Vous intervenez lors d\'une dispute entre deux personnes dans un lieu public. L\'une accuse l\'autre de l\'avoir bousculée volontairement. La tension monte et les voix s\'élèvent. Comment réagissez-vous ?',
        expectedBehavior: 'Calme, séparation des parties, écoute, médiation',
        correctAnswer: 'Séparer les parties, écouter chacun séparément, rester neutre, chercher des témoins, désamorcer la tension',
        createdBy: 'system'
      },
      {
        title: 'Contrôle d\'identité',
        description: 'Lors d\'un contrôle de routine, une personne refuse de présenter ses papiers et devient agressive verbalement. Elle crie qu\'elle connaît ses droits et menace de porter plainte. Quelle est votre approche ?',
        expectedBehavior: 'Fermeté respectueuse, explication des obligations, calme',
        correctAnswer: 'Expliquer calmement l\'obligation légale, rester professionnel, ne pas céder à la provocation, appliquer la procédure',
        createdBy: 'system'
      },
      {
        title: 'Urgence médicale',
        description: 'Vous êtes appelé pour une personne qui s\'est effondrée dans la rue. À votre arrivée, vous constatez qu\'elle est consciente mais se plaint de douleurs thoraciques. Des curieux se rassemblent. Quelles sont vos priorités ?',
        expectedBehavior: 'Sécurisation, premiers secours, appel urgences, gestion foule',
        correctAnswer: 'Sécuriser la zone, évaluer l\'état de la victime, appeler les secours, disperser les curieux, rassurer la victime',
        createdBy: 'system'
      }
    ]

    for (const situation of situations) {
      await prisma.situation.create({ data: situation })
    }

    console.log('Mises en situation créées')

  } catch (error) {
    console.error('Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminCode()
