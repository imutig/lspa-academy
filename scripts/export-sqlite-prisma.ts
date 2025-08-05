/**
 * Export des données SQLite vers JSON en utilisant Prisma
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

// Client SQLite (ancien)
const sqliteClient = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
})

async function exportDataFromSQLite() {
  console.log('🔍 Vérification des données SQLite...')
  
  try {
    // Test de connexion
    await sqliteClient.$connect()
    console.log('✅ Connexion SQLite réussie')

    const exportData: any = {}

    // Export Users
    try {
      const users = await sqliteClient.user.findMany()
      exportData.users = users
      console.log(`📊 Users: ${users.length} enregistrements`)
    } catch (e) {
      console.log('⚠️  Users: table vide ou erreur')
      exportData.users = []
    }

    // Export Sessions
    try {
      const sessions = await sqliteClient.session.findMany()
      exportData.sessions = sessions
      console.log(`📊 Sessions: ${sessions.length} enregistrements`)
    } catch (e) {
      console.log('⚠️  Sessions: table vide ou erreur')
      exportData.sessions = []
    }

    // Export Quizzes
    try {
      const quizzes = await sqliteClient.quiz.findMany({
        include: {
          questions: true
        }
      })
      exportData.quizzes = quizzes
      console.log(`📊 Quizzes: ${quizzes.length} enregistrements`)
    } catch (e) {
      console.log('⚠️  Quizzes: table vide ou erreur')
      exportData.quizzes = []
    }

    // Export Questions
    try {
      const questions = await sqliteClient.question.findMany()
      exportData.questions = questions
      console.log(`📊 Questions: ${questions.length} enregistrements`)
    } catch (e) {
      console.log('⚠️  Questions: table vide ou erreur')
      exportData.questions = []
    }

    // Export Interviews
    try {
      const interviews = await sqliteClient.interview.findMany()
      exportData.interviews = interviews
      console.log(`📊 Interviews: ${interviews.length} enregistrements`)
    } catch (e) {
      console.log('⚠️  Interviews: table vide ou erreur')
      exportData.interviews = []
    }

    // Export Quiz Attempts
    try {
      const attempts = await sqliteClient.quizAttempt.findMany()
      exportData.quizAttempts = attempts
      console.log(`📊 Quiz Attempts: ${attempts.length} enregistrements`)
    } catch (e) {
      console.log('⚠️  Quiz Attempts: table vide ou erreur')
      exportData.quizAttempts = []
    }

    // Sauvegarde
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    const backupPath = path.join(process.cwd(), `backup-sqlite-data-${timestamp}.json`)
    fs.writeFileSync(backupPath, JSON.stringify(exportData, null, 2))
    
    console.log('✅ Backup complet sauvegardé:', backupPath)
    
    // Statistiques
    const totalRecords = Object.values(exportData).reduce((sum: number, table: any) => sum + (Array.isArray(table) ? table.length : 0), 0)
    console.log(`📈 Total: ${totalRecords} enregistrements exportés`)

    if (totalRecords > 0) {
      console.log('📝 Données trouvées ! Nous allons les migrer vers PostgreSQL')
    } else {
      console.log('ℹ️  Aucune donnée trouvée - base SQLite vide ou nouvelle installation')
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error)
    console.log('ℹ️  Vérifiez que le fichier ./prisma/dev.db existe')
  } finally {
    await sqliteClient.$disconnect()
  }
}

exportDataFromSQLite()
