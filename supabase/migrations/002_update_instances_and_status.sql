-- ==============================================================================
-- Migration : 002_update_instances_and_status.sql
-- Description : Mise à jour des 9 instances (abréviations & couleurs)
--               et ajout du statut 'en_test' à l'énumération activity_status.
-- ==============================================================================

-- 1. Ajout sécurisé du statut 'en_test' s'il n'existe pas déjà
DO $$ 
BEGIN
    ALTER TYPE activity_status ADD VALUE IF NOT EXISTS 'en_test' BEFORE 'bloque';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Réinitialisation des instances existantes pour tous les profils existants
DELETE FROM public.instances;

INSERT INTO public.instances (user_id, name, code, color, order_index)
SELECT 
    p.id,
    inst.name,
    inst.code,
    inst.color,
    inst.order_index
FROM public.profiles p
CROSS JOIN (
    VALUES 
        ('DEV', 'DEV', '#0284c7', 1),
        ('TEST', 'TEST', '#6366f1', 2),
        ('QA', 'QA', '#0d9488', 3),
        ('INT', 'INT', '#2563eb', 4),
        ('REC', 'REC', '#9333ea', 5),
        ('FORM', 'FORM', '#16a34a', 6),
        ('EQNX', 'EQNX', '#ea580c', 7),
        ('PPROD', 'PPROD', '#d97706', 8),
        ('PROD', 'PROD', '#e11d48', 9)
) AS inst(name, code, color, order_index);

-- 3. Mise à jour de la fonction trigger pour les futurs comptes créés
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

    -- Insérer les 9 instances par défaut pour ce nouvel utilisateur
    INSERT INTO public.instances (user_id, name, code, color, order_index)
    VALUES
        (NEW.id, 'DEV', 'DEV', '#0284c7', 1),
        (NEW.id, 'TEST', 'TEST', '#6366f1', 2),
        (NEW.id, 'QA', 'QA', '#0d9488', 3),
        (NEW.id, 'INT', 'INT', '#2563eb', 4),
        (NEW.id, 'REC', 'REC', '#9333ea', 5),
        (NEW.id, 'FORM', 'FORM', '#16a34a', 6),
        (NEW.id, 'EQNX', 'EQNX', '#ea580c', 7),
        (NEW.id, 'PPROD', 'PPROD', '#d97706', 8),
        (NEW.id, 'PROD', 'PROD', '#e11d48', 9)
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
