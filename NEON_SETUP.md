# Instructions pour récupérer les variables Neon

## Méthode 1 : Dashboard Vercel
1. Vercel Dashboard > Votre projet
2. Storage tab > Votre base Neon
3. Chercher "Connection String" ou "Environment Variables"

## Méthode 2 : Dashboard Neon
1. Aller sur console.neon.tech
2. Sélectionner votre projet
3. Dashboard > Connection Details
4. Copier "Connection String"

## Méthode 3 : Variables Vercel
1. Vercel > Settings > Environment Variables
2. Chercher DATABASE_URL et DIRECT_URL

## Format attendu :
DATABASE_URL="postgresql://username:password@hostname/dbname?sslmode=require"
DIRECT_URL="postgresql://username:password@hostname/dbname?sslmode=require"

## Une fois trouvées :
1. Créer un fichier .env.local
2. Ajouter les variables
3. Tester la connexion
