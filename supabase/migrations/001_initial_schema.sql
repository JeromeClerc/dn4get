-- ==============================================================================
-- Migration : 001_initial_schema.sql
-- Application : Dn4Get (Do Not Forget)
-- Description : Schéma initial, RLS, Triggers, Realtime et Storage
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TYPES ENUM
DO $$ BEGIN
    CREATE TYPE activity_status AS ENUM ('ouvert', 'en_cours', 'en_test', 'bloque', 'en_attente', 'termine');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE activity_priority AS ENUM ('faible', 'normal', 'elevee', 'critique');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLE : PROFILES (synchronisée avec auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    phone_number TEXT,
    phone_notifications_enabled BOOLEAN DEFAULT FALSE,
    email_notifications_enabled BOOLEAN DEFAULT TRUE,
    push_notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. TABLE : CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. TABLE : INSTANCES
CREATE TABLE IF NOT EXISTS public.instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL, -- test, integration, dev, form, pre-prod, prod
    color TEXT DEFAULT '#10b981',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. TABLE : ACTIVITIES
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    status activity_status DEFAULT 'ouvert' NOT NULL,
    priority activity_priority DEFAULT 'normal' NOT NULL,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. TABLE : ACTIVITY_INSTANCES (Suivi cumulatif des instances traitées)
CREATE TABLE IF NOT EXISTS public.activity_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    instance_name TEXT NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_activity_instance UNIQUE(activity_id, instance_name)
);

-- 8. TABLE : ACTIVITY_NOTES (Note pré-structurée spécifique métier)
CREATE TABLE IF NOT EXISTS public.activity_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE UNIQUE,
    urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    usurper TEXT DEFAULT '',
    xsl_libraries TEXT DEFAULT '',
    -- params structure : { "portail": { "onglet": { "cellule": "détails texte libre" } } }
    params JSONB DEFAULT '{"portail": "", "onglet": "", "cellule": "", "details": ""}'::jsonb,
    variables TEXT DEFAULT '',
    ewxsladm TEXT DEFAULT '',
    rdo TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. TABLE : ATTACHMENTS (Pièces jointes stockées sur Supabase Storage)
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. TABLE : NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'due_date', 'status_change', 'instance_update'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- INDEX POUR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_client_id ON public.activities(client_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON public.activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_due_date ON public.activities(due_date);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_instances_activity_id ON public.activity_instances(activity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON public.notifications(user_id, is_read);

-- ==============================================================================
-- FONCTIONS ET TRIGGERS AUTOMATIQUES
-- ==============================================================================

-- Trigger updated_at automatique
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_activities_updated_at
    BEFORE UPDATE ON public.activities
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trigger_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trigger_activity_notes_updated_at
    BEFORE UPDATE ON public.activity_notes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger création automatique du profil après inscription OAuth Google
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);

    -- Insérer les instances par défaut pour ce nouvel utilisateur
    INSERT INTO public.instances (user_id, name, code, color, order_index)
    VALUES
        (NEW.id, 'Test', 'test', '#6366f1', 1),
        (NEW.id, 'Intégration', 'integration', '#3b82f6', 2),
        (NEW.id, 'Développement', 'dev', '#06b6d4', 3),
        (NEW.id, 'Formation', 'form', '#10b981', 4),
        (NEW.id, 'Pré-production', 'pre-prod', '#f59e0b', 5),
        (NEW.id, 'Production', 'prod', '#ef4444', 6)
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - ISOLATION STRICTE
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Politiques Profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Politiques Clients
CREATE POLICY "Users can manage own clients" ON public.clients
    FOR ALL USING (auth.uid() = user_id);

-- Politiques Instances
CREATE POLICY "Users can manage own instances" ON public.instances
    FOR ALL USING (auth.uid() = user_id);

-- Politiques Activities
CREATE POLICY "Users can manage own activities" ON public.activities
    FOR ALL USING (auth.uid() = user_id);

-- Politiques Activity Instances
CREATE POLICY "Users can manage activity instances through activity ownership" ON public.activity_instances
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.activities a
            WHERE a.id = activity_instances.activity_id AND a.user_id = auth.uid()
        )
    );

-- Politiques Activity Notes
CREATE POLICY "Users can manage activity notes through activity ownership" ON public.activity_notes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.activities a
            WHERE a.id = activity_notes.activity_id AND a.user_id = auth.uid()
        )
    );

-- Politiques Attachments
CREATE POLICY "Users can manage own attachments" ON public.attachments
    FOR ALL USING (auth.uid() = user_id);

-- Politiques Notifications
CREATE POLICY "Users can manage own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- REALTIME SUBSCRIPTIONS
-- ==============================================================================
-- Active la publication temps réel pour les activités et notifications
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'activities'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'activity_instances'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_instances;
    END IF;
END $$;

-- ==============================================================================
-- STORAGE CONFIGURATION (Bucket attachments)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Politiques Storage
CREATE POLICY "User can view own bucket objects" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "User can upload own bucket objects" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "User can delete own bucket objects" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
