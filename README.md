# 🎓 LSPA Academy - Système de Gestion des Formations

## 📋 Description

LSPA Academy est une plateforme complète de gestion des formations et évaluations pour l'école de pilotage LSPA. Le système permet la gestion des candidats, sessions de formation, quiz d'évaluation et entretiens individuels.

## ✨ Fonctionnalités

### 🔐 Authentification & Autorisation
- Système de rôles : Candidat, Instructeur, Superviseur, Directeur
- Authentification sécurisée avec NextAuth.js
- Pages protégées selon les permissions

### 👥 Gestion des Utilisateurs
- Inscription avec codes d'invitation
- Profils utilisateurs détaillés
- Gestion des rôles et permissions

### 📚 Gestion des Sessions
- Création et planification des sessions de formation
- Inscription des candidats
- Suivi des progressions

### 📝 Système de Quiz
- Création de quiz avec questions personnalisées
- Assignation de quiz aux sessions
- Scores et évaluations automatiques
- Seuils de réussite configurables

### 🎤 Système d'Entretiens
- Interface complète d'entretien individuel
- Questions techniques prédéfinies
- Mises en situation aléatoires (3 parmi 7+)
- Évaluation et notation détaillée
- Comptes-rendus complets
- Prise en charge et désassignation des entretiens

### 📊 Dashboard Administratif
- Vue d'ensemble des statistiques
- Gestion centralisée de tous les modules
- Interface moderne avec animations fluides

## 🛠️ Technologies

### Frontend
- **Next.js 15** - Framework React avec App Router
- **TypeScript** - Typage statique
- **CSS-in-JS** - Styling moderne avec animations
- **React Hooks** - Gestion d'état moderne

### Backend
- **Next.js API Routes** - API REST intégrée
- **Prisma** - ORM moderne pour base de données
- **SQLite** - Base de données légère pour développement
- **NextAuth.js** - Authentification sécurisée

### Sécurité
- **NextAuth.js** - Sessions sécurisées
- **bcryptjs** - Hashage des mots de passe
- **CSRF Protection** - Protection contre les attaques CSRF

## 🚀 Installation

### Prérequis
- Node.js 18+ 
- npm ou yarn
- Git

### Étapes d'installation

1. **Cloner le repository**
```bash
git clone https://github.com/votre-username/lspa-academy.git
cd lspa-academy
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer l'environnement**
```bash
cp .env.example .env.local
```

4. **Initialiser la base de données**
```bash
npx prisma generate
npx prisma db push
npm run seed
```

5. **Lancer le serveur de développement**
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## 🔧 Configuration

### Variables d'environnement requises

Créez un fichier `.env.local` avec :

```bash
# Base de données
DATABASE_URL="file:./dev.db"

# NextAuth.js
NEXTAUTH_SECRET="votre-secret-nextauth-ici"
NEXTAUTH_URL="http://localhost:3000"
```

## 📖 Utilisation

### Comptes par défaut

Après l'installation et le seed :
- **Admin** : `administrateur.lspa` / `admin123`
- **Code d'inscription** : `LSPA2025`

### Workflow typique

1. **Connexion administrateur** → Dashboard
2. **Création de session** → Module Sessions
3. **Ajout de candidats** → Codes d'inscription
4. **Configuration quiz** → Module Quiz & Questions
5. **Gestion entretiens** → Détails de session
6. **Suivi progression** → Dashboard & rapports

## 🎨 Interface Utilisateur

Design moderne avec :
- **Glass morphism effects** - Effets de transparence avancés
- **Animations fluides** - Transitions CSS optimisées
- **Design responsive** - Compatible mobile et desktop
- **Thème cohérent** - Palette de couleurs professionnelle

## 🔄 Scripts disponibles

```bash
# Développement
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run start        # Serveur de production

# Base de données
npm run seed         # Données d'initialisation
npx prisma studio    # Interface graphique DB
npx prisma generate  # Générer le client Prisma
npx prisma db push   # Appliquer le schema

# Qualité du code
npm run lint         # ESLint
npm run type-check   # Vérification TypeScript
```

## 📁 Structure du projet

```
lspa-academy/
├── src/
│   ├── app/                 # Pages Next.js (App Router)
│   │   ├── admin/          # Pages d'administration
│   │   ├── candidate/      # Interface candidat
│   │   ├── api/            # Routes API
│   │   └── auth/           # Pages d'authentification
│   ├── components/         # Composants réutilisables
│   ├── lib/               # Configuration (auth, prisma)
│   ├── utils/             # Fonctions utilitaires
│   └── types/             # Types TypeScript
├── prisma/                # Schema et migrations
├── public/               # Assets statiques
├── scripts/              # Scripts d'initialisation
└── docs/                 # Documentation
```

## 🎯 Modules principaux

### 1. Authentification
- Login/Register avec codes d'invitation
- Gestion des sessions utilisateur
- Protection des routes par rôle

### 2. Gestion des Sessions
- Création et planification
- Inscription des candidats
- Suivi des statuts

### 3. Système de Quiz
- Éditeur de questions
- Assignation aux sessions
- Correction automatique

### 4. Entretiens Individuels
- Questions techniques
- Mises en situation
- Évaluation détaillée
- Comptes-rendus

### 5. Dashboard Admin
- Statistiques en temps réel
- Gestion centralisée
- Exports et rapports

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence privée - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📞 Support

Pour toute question ou support :
- 📧 Email : support@lspa-academy.com
- 📱 Téléphone : +33 1 23 45 67 89

---

Développé avec ❤️ pour LSPA Academy
