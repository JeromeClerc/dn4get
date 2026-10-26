# Guide de Configuration Supabase - Dn4Get (Do Not Forget)

Ce document décrit toutes les étapes nécessaires pour configurer et connecter votre projet Supabase avec l'application **Dn4Get**.

---

## 1. Variables d'Environnement (`.env.local`)

À la racine du projet (`D:\Takk\App\dn4get\.env.local`), configurez les variables suivantes :

```env
# URL de votre projet Supabase (ex: https://xyzcompany.supabase.co)
VITE_SUPABASE_URL=https://votre-projet.supabase.co

# Clé publique anonyme (Anon / Public API Key)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Clé de service (Réservée aux scripts d'administration backend / Edge Functions - NE JAMAIS EXPOSER DANS LE FRONTEND)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optionnel : Activation du mode Démo / Hors-ligne (true par défaut si aucune clé n'est fournie)
VITE_ENABLE_MOCK_FALLBACK=true
```

> **Comment obtenir ces clés :**
> Rendez-vous dans votre projet sur le [Dashboard Supabase](https://supabase.com/dashboard) > **Project Settings** > **API**. Copiez l'**URL du projet** et la clé **anon / public**.

---

## 2. Configuration de l'Authentification Google OAuth

Pour permettre aux utilisateurs de se connecter avec leur compte Google :

### Étape A : Créer les identifiants sur Google Cloud Console
1. Rendez-vous sur la [Google Cloud Console](https://console.cloud.google.com/).
2. Créez un projet ou sélectionnez votre projet existant.
3. Configurez l'**Écran de consentement OAuth** (OAuth consent screen) :
   - Type d'utilisateur : **Externe**.
   - Renseignez le nom de l'application : `Dn4Get`.
   - Ajoutez l'adresse e-mail de contact.
4. Allez dans **Identifiants** (Credentials) > **Créer des identifiants** > **ID client OAuth** :
   - Type d'application : **Application Web**.
   - Nom : `Dn4Get Supabase Auth`.
   - **URI de redirection autorisés** : ajoutez l'URL fournie par Supabase sous la forme :
     `https://<votre-id-projet>.supabase.co/auth/v1/callback`
5. Récupérez le **Client ID** et le **Client Secret**.

### Étape B : Activer Google dans Supabase
1. Dans le dashboard Supabase, allez dans **Authentication** > **Providers** > **Google**.
2. Basculez le commutateur sur **Enabled**.
3. Renseignez :
   - **Client ID** (obtenu sur Google Cloud)
   - **Client Secret** (obtenu sur Google Cloud)
4. Cliquez sur **Save**.

---

## 3. Configuration des Notifications par Téléphone (SMS / WhatsApp)

Dn4Get intègre le support des notifications par téléphone portable (numéro mobile). Deux options sont disponibles :

### Option 1 : Via le fournisseur natif Supabase Auth Phone (Twilio ou MessageBird)
1. Dans Supabase, allez dans **Authentication** > **Providers** > **Phone**.
2. Activez le fournisseur (Twilio, MessageBird, Vonage ou Twilio Verify).
3. Renseignez vos identifiants (Account SID, Auth Token, Numéro expéditeur Twilio).
4. Cette option permet également la connexion sans mot de passe par SMS OTP (code de vérification à 6 chiffres).

### Option 2 : Via Supabase Edge Function dédiée (Notifications WhatsApp & SMS)
Pour envoyer des alertes proactives de date d'échéance :
1. Créez un compte [Twilio](https://www.twilio.com/) ou [MessageBird / Bird](https://bird.com/).
2. Déployez l'Edge Function Supabase `send-due-notification` avec le template fourni dans `supabase/functions/send-due-notification`.
3. Configurez les secrets dans Supabase via :
   ```bash
   supabase secrets set TWILIO_ACCOUNT_SID=... TWILIO_AUTH_TOKEN=... TWILIO_PHONE_NUMBER=...
   ```
4. Un cron job ou un trigger pg_cron dans Postgres appellera cette fonction chaque matin pour alerter sur les tâches arrivant à échéance.

---

## 4. Initialisation de la Base de Données

Exécutez le script SQL fourni dans le fichier :
📁 `supabase/migrations/001_initial_schema.sql`

Dans le dashboard Supabase :
1. Allez dans **SQL Editor**.
2. Cliquez sur **New query**.
3. Collez l'intégralité du contenu de `001_initial_schema.sql`.
4. Cliquez sur **Run**.

Ce script configure :
- La table des profils utilisateurs (`profiles`) synchronisée automatiquement avec `auth.users`.
- Les tables métiers : `clients`, `instances`, `activities`, `activity_instances`, `activity_notes`, `attachments`, `notifications`.
- La synchronisation temps réel (`supabase_realtime`) sur la table `activities` et `notifications`.
- Les règles **Row Level Security (RLS)** garantissant une isolation stricte des données de chaque utilisateur.
- Le bucket de stockage `attachments` dans Supabase Storage avec contrôle d'accès pour les captures d'écran et documents.
