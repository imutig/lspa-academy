/**
 * Export simple des données SQLite
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

async function exportSQLiteData() {
  console.log('💾 Export des données SQLite...')
  
  try {
    // Vérifier si le fichier SQLite existe
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    
    if (!fs.existsSync(dbPath)) {
      console.log('❌ Fichier SQLite introuvable:', dbPath)
      console.log('ℹ️  Pas de données à migrer')
      return
    }

    // Utiliser sqlite3 pour exporter
    console.log('📊 Export des tables...')
    
    // Export de chaque table
    const tables = ['User', 'Session', 'Quiz', 'Question', 'Interview', 'InterviewQuestion', 'InterviewSituation']
    const exportData: any = {}

    for (const table of tables) {
      try {
        const result = execSync(`sqlite3 "${dbPath}" "SELECT * FROM ${table};"`, { 
          encoding: 'utf8',
          timeout: 10000 
        })
        
        if (result.trim()) {
          exportData[table] = result.trim().split('\n')
          console.log(`✅ Table ${table}: ${exportData[table].length} enregistrements`)
        } else {
          console.log(`ℹ️  Table ${table}: vide`)
          exportData[table] = []
        }
      } catch (error) {
        console.log(`⚠️  Table ${table}: erreur ou inexistante`)
        exportData[table] = []
      }
    }

    // Sauvegarder dans un fichier JSON
    const backupPath = path.join(process.cwd(), `backup-sqlite-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`)
    fs.writeFileSync(backupPath, JSON.stringify(exportData, null, 2))
    
    console.log('✅ Backup SQLite sauvegardé:', backupPath)
    console.log('📝 Vous pouvez maintenant continuer avec PostgreSQL')

  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error)
    console.log('ℹ️  Continuez avec PostgreSQL (pas de données à migrer)')
  }
}

exportSQLiteData()
