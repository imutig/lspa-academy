# 🚀 Guide de déploiement sur Vercel

## Prérequis
- Compte Vercel
- Compte GitHub (pour le code)
- Base de données PostgreSQL (Vercel Postgres recommandé)

## 📋 Étapes de déploiement

### 1. Préparer la base de données

#### Option A: Neon (Recommandé #1)
1. Aller sur [vercel.com](https://vercel.com) > Votre projet
2. Onglet "Storage" > "Create Database"
3. Sélectionner **"Neon - Serverless Postgres"**
4. ⚠️ **IMPORTANT**: Ne PAS activer "Auth" (vous avez déjà NextAuth)
5. Créer la base de données PostgreSQL simple
6. Copier les variables `DATABASE_URL` et `DIRECT_URL`
7. **Avantages** : 3GB gratuit, serverless, excellent pour production

#### Option B: Supabase (Recommandé #2)
1. Dans Vercel Storage, sélectionner **"Supabase - Postgres backend"**
2. Ou directement sur [supabase.com](https://supabase.com)
3. Créer un nouveau projet
4. Settings > Database > Connection string
5. **Avantages** : 500MB gratuit, interface admin, outils intégrés

#### Option C: Prisma Postgres (Nouveau)
1. Dans Vercel Storage, sélectionner **"Prisma Postgres - Edge-ready"**
2. Configuration automatique avec votre projet
3. **Avantages** : Optimisé pour Prisma, sans cold starts

### 2. Migration des données (IMPORTANT)

```bash
# 1. Exporter les données existantes (backup)
npm run migrate:export

# 2. Configurer la nouvelle DB PostgreSQL dans .env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# 3. Générer et appliquer les migrations
npx prisma generate
npx prisma db push

# 4. Migrer les données
npm run migrate:data

# 5. Vérifier les données
npx prisma studio
```

### 3. Configuration Vercel

#### Variables d'environnement à configurer:
```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXTAUTH_URL=https://votre-app.vercel.app
NEXTAUTH_SECRET=votre-secret-32-caracteres-minimum
```

#### Dans le dashboard Vercel:
1. Projet > Settings > Environment Variables
2. Ajouter chaque variable pour "Production", "Preview", et "Development"

### 4. Déploiement

```bash
# 1. Pousser le code sur GitHub
git add .
git commit -m "Préparation déploiement Vercel"
git push origin main

# 2. Connecter le repo à Vercel
# - Aller sur vercel.com
# - "Import Project" depuis GitHub
# - Sélectionner votre repo
# - Vercel détectera automatiquement Next.js
```

### 5. Post-déploiement

```bash
# 1. Initialiser la DB en production (une seule fois)
# Dans le terminal Vercel ou en local avec la prod DB:
npx prisma db push
npm run seed # Si vous avez un script de seed
```

## 🔧 Résolution des problèmes courants

### Erreur "Module not found"
- Vérifier que tous les packages sont dans `dependencies` (pas `devDependencies`)
- Ajouter au package.json si nécessaire

### Erreur de base de données
- Vérifier les variables d'environnement
- S'assurer que la DB est accessible depuis Vercel
- Vérifier les règles de firewall

### Erreur NextAuth
- Vérifier `NEXTAUTH_URL` (doit être l'URL de production)
- `NEXTAUTH_SECRET` doit faire au moins 32 caractères

### Timeout des fonctions
- Les fonctions Vercel ont un timeout de 10s par défaut
- Augmenter dans `vercel.json` si nécessaire

## 📊 Monitoring

- Logs: Dashboard Vercel > Functions
- Base de données: Vercel Postgres Dashboard
- Performance: Vercel Analytics

## 🔄 Déploiement continu

Une fois configuré, chaque push sur la branche main déclenchera automatiquement un nouveau déploiement.

## 🛠 Maintenance

### Mise à jour de la DB
```bash
# Modifier schema.prisma
npx prisma db push # En production
```

### Backup de la DB
```bash
# Exporter régulièrement les données
npm run migrate:export
```
