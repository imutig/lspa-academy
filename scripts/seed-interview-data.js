const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedInterviewData() {
  try {
    console.log('🌱 Ajout des données d\'entretien...')

    // Ajouter des questions d'entretien
    const questions = [
      {
        question: "Parlez-moi de votre motivation pour rejoindre notre académie de pilotage.",
        category: "INTERVIEW",
        points: 5
      },
      {
        question: "Comment gérez-vous le stress dans des situations critiques ?",
        category: "INTERVIEW", 
        points: 4
      },
      {
        question: "Décrivez une situation où vous avez dû prendre une décision rapide sous pression.",
        category: "INTERVIEW",
        points: 4
      },
      {
        question: "Quelles sont vos forces et faiblesses en tant que futur pilote ?",
        category: "INTERVIEW",
        points: 3
      },
      {
        question: "Comment travaillez-vous en équipe, notamment dans un cockpit ?",
        category: "INTERVIEW",
        points: 4
      }
    ]

    for (const questionData of questions) {
      try {
        await prisma.question.create({
          data: questionData
        })
        console.log(`✅ Question ajoutée: ${questionData.question.substring(0, 50)}...`)
      } catch (error) {
        if (error.code !== 'P2002') { // Ignorer les erreurs de doublons
          console.log(`⚠️  Question déjà existante: ${questionData.question.substring(0, 50)}...`)
        }
      }
    }

    console.log('✅ Questions d\'entretien ajoutées')

    // Ajouter des situations d'entretien
    const situations = [
      {
        title: "Panne moteur en vol",
        description: "Vous êtes aux commandes d'un avion monomoteur à 3000 pieds d'altitude lorsque le moteur tombe soudainement en panne. L'aéroport le plus proche est à 10 km. Que faites-vous ?",
        expectedBehavior: "Garder son calme, établir la meilleure vitesse de plané, identifier un terrain d'atterrissage d'urgence, suivre les procédures d'urgence, communiquer avec le contrôle",
        difficulty: "HIGH",
        category: "EMERGENCY",
        createdBy: "system"
      },
      {
        title: "Conditions météorologiques dégradées",
        description: "Vous approchez de votre destination mais la météo s'est dégradée avec une visibilité réduite à 1500m et un plafond nuageux bas. Vos réserves de carburant sont limitées.",
        expectedBehavior: "Évaluer les conditions réelles, considérer un déroutement, respecter les minimums météo, prendre une décision éclairée sur la poursuite ou l'abandon de l'approche",
        difficulty: "MEDIUM",
        category: "WEATHER",
        createdBy: "system"
      },
      {
        title: "Conflit avec un passager difficile",
        description: "Un passager refuse de respecter les consignes de sécurité et devient agressif envers l'équipage. La situation perturbe les autres passagers et crée une tension à bord.",
        expectedBehavior: "Rester calme et professionnel, désamorcer la situation, faire appliquer les règles de sécurité, informer le commandant de bord, documenter l'incident",
        difficulty: "MEDIUM", 
        category: "PASSENGER_RELATIONS",
        createdBy: "system"
      },
      {
        title: "Dysfonctionnement des instruments",
        description: "En vol, vous remarquez que plusieurs instruments principaux affichent des valeurs incohérentes. Vous suspectez un problème électrique ou de pitot statique.",
        expectedBehavior: "Identifier les instruments fiables, utiliser les instruments de secours, suivre les procédures de panne, maintenir le contrôle de l'aéronef, déclarer une urgence si nécessaire",
        difficulty: "HIGH",
        category: "TECHNICAL",
        createdBy: "system"
      },
      {
        title: "Gestion d'équipe en situation critique",
        description: "Vous êtes commandant de bord et votre copilote commet une erreur importante lors d'une approche difficile. Comment gérez-vous cette situation ?",
        expectedBehavior: "Corriger immédiatement l'erreur, reprendre les commandes si nécessaire, communiquer clairement, debriefing post-vol constructif, maintenir la sécurité avant tout",
        difficulty: "HIGH",
        category: "LEADERSHIP", 
        createdBy: "system"
      }
    ]

    for (const situationData of situations) {
      try {
        await prisma.situation.create({
          data: situationData
        })
        console.log(`✅ Situation ajoutée: ${situationData.title}`)
      } catch (error) {
        if (error.code !== 'P2002') { // Ignorer les erreurs de doublons
          console.log(`⚠️  Situation déjà existante: ${situationData.title}`)
        }
      }
    }

    console.log('✅ Situations d\'entretien ajoutées')
    console.log('🎉 Données d\'entretien seedées avec succès !')

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedInterviewData()
