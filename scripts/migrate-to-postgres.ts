/**
 * Script de migration des données SQLite vers PostgreSQL
 * Exécuter en local avant le déploiement
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

// Ancien client SQLite
const sqliteClient = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db' // Votre ancienne DB SQLite
    }
  }
})

// Nouveau client PostgreSQL
const postgresClient = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL // Votre nouvelle DB Postgres
    }
  }
})

async function migrateData() {
  console.log('🚀 Début de la migration des données...')

  try {
    // 1. Migrer les utilisateurs
    console.log('📝 Migration des utilisateurs...')
    const users = await sqliteClient.user.findMany()
    for (const user of users) {
      await postgresClient.user.upsert({
        where: { id: user.id },
        update: user,
        create: user
      })
    }
    console.log(`✅ ${users.length} utilisateurs migrés`)

    // 2. Migrer les sessions d'académie
    console.log('📝 Migration des sessions...')
    const sessions = await sqliteClient.session.findMany()
    for (const session of sessions) {
      await postgresClient.session.upsert({
        where: { id: session.id },
        update: session,
        create: session
      })
    }
    console.log(`✅ ${sessions.length} sessions migrées`)

    // 3. Migrer les quiz
    console.log('📝 Migration des quiz...')
    const quizzes = await sqliteClient.quiz.findMany({
      include: {
        questions: true
      }
    })
    for (const quiz of quizzes) {
      await postgresClient.quiz.upsert({
        where: { id: quiz.id },
        update: {
          title: quiz.title,
          description: quiz.description,
          timeLimit: quiz.timeLimit,
          passingScoreNormal: quiz.passingScoreNormal,
          passingScoreToWatch: quiz.passingScoreToWatch,
          createdAt: quiz.createdAt,
          updatedAt: quiz.updatedAt
        },
        create: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          timeLimit: quiz.timeLimit,
          passingScoreNormal: quiz.passingScoreNormal,
          passingScoreToWatch: quiz.passingScoreToWatch,
          createdAt: quiz.createdAt,
          updatedAt: quiz.updatedAt
        }
      })

      // Migrer les questions
      for (const question of quiz.questions) {
        await postgresClient.question.upsert({
          where: { id: question.id },
          update: question,
          create: question
        })
      }
    }
    console.log(`✅ ${quizzes.length} quiz migrés`)

    // 4. Migrer les autres données (entretiens, etc.)
    console.log('📝 Migration des entretiens...')
    const interviews = await sqliteClient.interview.findMany()
    for (const interview of interviews) {
      await postgresClient.interview.upsert({
        where: { id: interview.id },
        update: interview,
        create: interview
      })
    }
    console.log(`✅ ${interviews.length} entretiens migrés`)

    console.log('🎉 Migration terminée avec succès!')

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
  } finally {
    await sqliteClient.$disconnect()
    await postgresClient.$disconnect()
  }
}

// Exporter les données SQLite vers JSON (backup)
async function exportToJSON() {
  console.log('💾 Export des données vers JSON...')
  
  const data = {
    users: await sqliteClient.user.findMany(),
    sessions: await sqliteClient.session.findMany(),
    quizzes: await sqliteClient.quiz.findMany({ include: { questions: true } }),
    interviews: await sqliteClient.interview.findMany(),
    // Ajoutez d'autres tables si nécessaire
  }

  const backupPath = path.join(process.cwd(), 'backup-data.json')
  fs.writeFileSync(backupPath, JSON.stringify(data, null, 2))
  console.log(`✅ Backup sauvegardé: ${backupPath}`)
}

// Exécuter selon l'argument
const action = process.argv[2]

if (action === 'export') {
  exportToJSON()
} else if (action === 'migrate') {
  migrateData()
} else {
  console.log('Usage:')
  console.log('  npm run migrate:export  - Exporter les données SQLite vers JSON')
  console.log('  npm run migrate:data    - Migrer vers PostgreSQL')
}
