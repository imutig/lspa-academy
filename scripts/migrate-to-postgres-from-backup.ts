/**
 * Migration des données depuis le backup JSON vers PostgreSQL
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const postgresClient = new PrismaClient()

async function migrateFromBackup() {
  console.log('🚀 Migration des données vers PostgreSQL...')
  
  try {
    // Trouver le dernier fichier de backup
    const files = fs.readdirSync(process.cwd())
    const backupFiles = files.filter(f => f.startsWith('backup-sqlite-data-') && f.endsWith('.json'))
    
    if (backupFiles.length === 0) {
      console.log('❌ Aucun fichier de backup trouvé')
      return
    }

    // Prendre le plus récent
    const latestBackup = backupFiles.sort().reverse()[0]
    const backupPath = path.join(process.cwd(), latestBackup)
    
    console.log('📂 Lecture du backup:', latestBackup)
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'))

    // Test de connexion PostgreSQL
    await postgresClient.$connect()
    console.log('✅ Connexion PostgreSQL réussie')

    let totalMigrated = 0

    // 1. Migrer les utilisateurs
    if (backupData.users && backupData.users.length > 0) {
      console.log(`👥 Migration de ${backupData.users.length} utilisateurs...`)
      for (const user of backupData.users) {
        try {
          await postgresClient.user.upsert({
            where: { id: user.id },
            update: user,
            create: user
          })
          totalMigrated++
        } catch (e) {
          console.log(`⚠️  Erreur utilisateur ${user.username}:`, e.message)
        }
      }
      console.log(`✅ ${backupData.users.length} utilisateurs migrés`)
    }

    // 2. Migrer les sessions
    if (backupData.sessions && backupData.sessions.length > 0) {
      console.log(`📅 Migration de ${backupData.sessions.length} sessions...`)
      for (const session of backupData.sessions) {
        try {
          await postgresClient.session.upsert({
            where: { id: session.id },
            update: session,
            create: session
          })
          totalMigrated++
        } catch (e) {
          console.log(`⚠️  Erreur session ${session.name}:`, e.message)
        }
      }
      console.log(`✅ ${backupData.sessions.length} sessions migrées`)
    }

    // 3. Migrer les quiz
    if (backupData.quizzes && backupData.quizzes.length > 0) {
      console.log(`🧠 Migration de ${backupData.quizzes.length} quiz...`)
      for (const quiz of backupData.quizzes) {
        try {
          // Migrer le quiz sans les questions (relations)
          const { questions, ...quizData } = quiz
          await postgresClient.quiz.upsert({
            where: { id: quiz.id },
            update: quizData,
            create: quizData
          })
          totalMigrated++
        } catch (e) {
          console.log(`⚠️  Erreur quiz ${quiz.title}:`, e.message)
        }
      }
      console.log(`✅ ${backupData.quizzes.length} quiz migrés`)
    }

    // 4. Migrer les questions
    if (backupData.questions && backupData.questions.length > 0) {
      console.log(`❓ Migration de ${backupData.questions.length} questions...`)
      for (const question of backupData.questions) {
        try {
          await postgresClient.question.upsert({
            where: { id: question.id },
            update: question,
            create: question
          })
          totalMigrated++
        } catch (e) {
          console.log(`⚠️  Erreur question:`, e.message)
        }
      }
      console.log(`✅ ${backupData.questions.length} questions migrées`)
    }

    // 5. Migrer les entretiens
    if (backupData.interviews && backupData.interviews.length > 0) {
      console.log(`💼 Migration de ${backupData.interviews.length} entretiens...`)
      for (const interview of backupData.interviews) {
        try {
          await postgresClient.interview.upsert({
            where: { id: interview.id },
            update: interview,
            create: interview
          })
          totalMigrated++
        } catch (e) {
          console.log(`⚠️  Erreur entretien:`, e.message)
        }
      }
      console.log(`✅ ${backupData.interviews.length} entretiens migrés`)
    }

    console.log(`🎉 Migration terminée ! ${totalMigrated} éléments migrés`)
    console.log('📝 Vous pouvez maintenant tester votre application avec PostgreSQL')

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
  } finally {
    await postgresClient.$disconnect()
  }
}

migrateFromBackup()
