# Dn4Get (Do Not Forget) 🚀

> **Dn4Get** est une application web / PWA moderne, réactive et en temps réel, conçue pour les consultants et ingénieurs souhaitant piloter leurs activités professionnelles, leurs clients et le suivi cumulatif des déploiements sur les différentes instances de bases de données (`Test`, `Intégration`, `Dev`, `Form`, `Pré-prod`, `Prod`).

---

## 🌟 Fonctionnalités Clés

- **⚡ Saisie ultra-rapide (Style ClickUp)** : Créez une nouvelle tâche en tapant simplement un libellé ou un identifiant (`CU-XXXX`) et en appuyant sur `Entrée`.
- **🎯 Suivi cumulatif des instances DB** : Pastilles interactives pour marquer chaque environnement validé (`test`, `dev`, `integration`, `form`, `pre-prod`, `prod`) avec enregistrement automatique de la date et de l'heure en métadonnées.
- **📝 Note technique structurée** :
  - **URLs** : Liste de liens utiles avec accès direct.
  - **Usurper** : Compte utilisateur à usurper lors des tests.
  - **Librairies XSL** : Feuilles de transformation associées.
  - **Params hiérarchiques** : Structure `Portail` ➔ `Onglet` ➔ `Cellule` ➔ `Détails libres`.
  - **Variables & Ewxsladm** : Configuration d'environnement et commandes admin.
  - **RDO** : Référence de demande / ordre.
- **📎 Pièces jointes & Captures d'écran** : Zone de glisser-déposer pour associer des images, logs, specs ou captures d'erreurs.
- **🔔 Notifications & Échéances** : Menu déroulant dans l'en-tête alertant sur les échéances du jour, de demain ou en retard.
- **🔍 Filtrage et tri puissants** : Recherche full-text, filtrage par client, état, priorité, instance traitée, masquage des terminées et tris multiples.
- **📱 PWA Installable sur Android** : Manifest et Service Worker configurés via `vite-plugin-pwa` pour une utilisation plein écran sur smartphone Android.
- **🌓 Mode Sombre / Clair** : Thème sobre et contrasté avec bascule instantanée.
- **🔄 Synchronisation Hybride Supabase / LocalStorage** : Fonctionne immédiatement sans configuration avec données de démonstration pré-chargées, et se synchronise en temps réel dès que Supabase est connecté.

---

## 🛠️ Stack Technique

- **Frontend** : React 18, TypeScript (mode strict), Vite 6
- **Styles & Design** : Tailwind CSS, Lucide React, Canvas Confetti
- **État & Cache** : TanStack Query v5 (React Query)
- **Persistance & Temps Réel** : Supabase Client v2 (PostgreSQL + RLS + Realtime)
- **PWA** : `vite-plugin-pwa` (Workbox Service Worker + Web App Manifest)

---

## 🚀 Démarrage Rapide

### 1. Installation des dépendances
```bash
npm install
```

### 2. Lancer le serveur de développement
```bash
npm run dev
```
L'application est accessible sur : `http://localhost:5173/`

### 3. Compiler pour la production
```bash
npm run build
```

---

## 🗄️ Configuration Supabase

Consultez le guide complet dans le fichier [SETUP_SUPABASE.md](file:///d:/Takk/App/dn4get/SETUP_SUPABASE.md).

1. Copiez vos identifiants Supabase dans `.env.local` :
   ```env
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=votre_cle_anon_publique
   ```
2. Exécutez le script SQL de migration [001_initial_schema.sql](file:///d:/Takk/App/dn4get/supabase/migrations/001_initial_schema.sql) dans l'éditeur SQL de votre dashboard Supabase.
3. Activez l'authentification Google OAuth dans **Authentication** > **Providers**.

---

## 📂 Structure du Projet

```text
D:\Takk\App\dn4get/
├── public/                 # Manifest PWA, icônes, logo vectoriel SVG
├── src/
│   ├── assets/             # Assets statiques
│   ├── components/         # Composants React modulaires
│   │   ├── activities/     # QuickAddBar, ActivityCard, ActivityModal, FilterBar
│   │   ├── clients/        # ClientManagerModal
│   │   ├── layout/         # Header, PwaPrompt
│   │   └── notifications/  # NotificationDropdown
│   ├── contexts/           # AuthContext (Google OAuth & Démo), ThemeContext (Dark/Light)
│   ├── hooks/              # useDn4Get (TanStack Query + Realtime)
│   ├── lib/                # supabaseClient.ts, utils.ts
│   ├── services/           # dataService.ts, mockData.ts
│   ├── types/              # index.ts (interfaces TypeScript strictes)
│   ├── App.tsx             # Composant racine
│   ├── index.css           # Directives Tailwind CSS & scrollbars
│   └── main.tsx            # Point d'entrée ReactDOM
├── supabase/
│   └── migrations/         # 001_initial_schema.sql (RLS, tables, realtime, triggers)
├── SETUP_SUPABASE.md       # Guide pas-à-pas pour la configuration de Supabase & SMS
├── tailwind.config.js      # Configuration Tailwind CSS avec dark mode
├── tsconfig.json           # Configuration TypeScript
├── vite.config.ts          # Configuration Vite & PWA
└── package.json            # Dépendances du projet
```
# dn4get
