-- ==============================================================================
-- Migration : 003_due_date_notifications.sql
-- Description : Génération automatique des notifications d'échéance (Trigger
--               temps réel sur INSERT/UPDATE + Fonction quotidienne pg_cron)
-- ==============================================================================

-- 1. Fonction Trigger : Crée une notification dès qu'une activité est créée ou
--    modifiée avec une date d'échéance à aujourd'hui, demain ou dépassée.
CREATE OR REPLACE FUNCTION public.handle_activity_due_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_due_date DATE;
    v_today DATE;
    v_diff_days INTEGER;
    v_title TEXT;
    v_message TEXT;
BEGIN
    -- Ignorer si pas de date d'échéance ou si l'activité est terminée
    IF NEW.due_date IS NULL OR NEW.status = 'termine' THEN
        RETURN NEW;
    END IF;

    -- Conversion dans le fuseau Europe/Paris pour comparer les dates calendaires
    v_due_date := (NEW.due_date AT TIME ZONE 'Europe/Paris')::DATE;
    v_today := (NOW() AT TIME ZONE 'Europe/Paris')::DATE;
    v_diff_days := v_due_date - v_today;

    IF v_diff_days = 0 THEN
        v_title := 'Échéance aujourd''hui';
        v_message := 'L''activité "' || NEW.title || '" arrive à échéance aujourd''hui.';
    ELSIF v_diff_days < 0 THEN
        v_title := 'Échéance dépassée';
        v_message := 'L''activité "' || NEW.title || '" est en retard de ' || ABS(v_diff_days) || ' j.';
    ELSIF v_diff_days = 1 THEN
        v_title := 'Échéance demain';
        v_message := 'L''activité "' || NEW.title || '" arrive à échéance demain.';
    ELSIF TG_OP = 'UPDATE' AND (OLD.due_date IS DISTINCT FROM NEW.due_date) THEN
        v_title := 'Date d''échéance modifiée';
        v_message := 'L''échéance de "' || NEW.title || '" a été fixée au ' || TO_CHAR(v_due_date, 'DD/MM/YYYY') || '.';
    ELSE
        RETURN NEW;
    END IF;

    -- Anti-doublon : vérifier qu'une notification identique n'a pas déjà été créée aujourd'hui
    IF NOT EXISTS (
        SELECT 1
        FROM public.notifications n
        WHERE n.activity_id = NEW.id
          AND n.type = 'due_date'
          AND n.title = v_title
          AND (
              (n.created_at AT TIME ZONE 'Europe/Paris')::DATE = v_today
              OR n.is_read = FALSE
          )
    ) THEN
        INSERT INTO public.notifications (user_id, activity_id, type, title, message, is_read)
        VALUES (NEW.user_id, NEW.id, 'due_date', v_title, v_message, FALSE);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Création du trigger sur la table activities
DROP TRIGGER IF EXISTS trigger_activity_due_notification ON public.activities;
CREATE TRIGGER trigger_activity_due_notification
    AFTER INSERT OR UPDATE OF due_date, status, title ON public.activities
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_activity_due_notification();

-- ==============================================================================
-- 2. Fonction de vérification quotidienne (pour pg_cron ou appel manuel)
--    Génère les notifications pour toutes les activités arrivant à échéance
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.generate_daily_due_notifications()
RETURNS INTEGER AS $$
DECLARE
    r RECORD;
    v_today DATE := (NOW() AT TIME ZONE 'Europe/Paris')::DATE;
    v_due_date DATE;
    v_diff_days INTEGER;
    v_title TEXT;
    v_message TEXT;
    v_count INTEGER := 0;
BEGIN
    FOR r IN
        SELECT id, user_id, title, due_date
        FROM public.activities
        WHERE status <> 'termine'
          AND due_date IS NOT NULL
    LOOP
        v_due_date := (r.due_date AT TIME ZONE 'Europe/Paris')::DATE;
        v_diff_days := v_due_date - v_today;

        IF v_diff_days = 0 THEN
            v_title := 'Échéance aujourd''hui';
            v_message := 'L''activité "' || r.title || '" arrive à échéance aujourd''hui.';
        ELSIF v_diff_days < 0 THEN
            v_title := 'Échéance dépassée';
            v_message := 'L''activité "' || r.title || '" est en retard de ' || ABS(v_diff_days) || ' j.';
        ELSIF v_diff_days = 1 THEN
            v_title := 'Échéance demain';
            v_message := 'L''activité "' || r.title || '" arrive à échéance demain.';
        ELSE
            CONTINUE;
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM public.notifications n
            WHERE n.activity_id = r.id
              AND n.type = 'due_date'
              AND n.title = v_title
              AND (n.created_at AT TIME ZONE 'Europe/Paris')::DATE = v_today
        ) THEN
            INSERT INTO public.notifications (user_id, activity_id, type, title, message, is_read)
            VALUES (r.user_id, r.id, 'due_date', v_title, v_message, FALSE);
            v_count := v_count + 1;
        END IF;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 3. Planification automatique avec pg_cron (si l'extension pg_cron est activée)
--    S'exécute tous les matins à 07:00 UTC (08:00 / 09:00 heure de Paris)
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule(
            'dn4get-daily-due-notifications',
            '0 7 * * *',
            $cron$SELECT public.generate_daily_due_notifications();$cron$
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'pg_cron non activé : vous pouvez l''activer dans Database > Extensions.';
END $$;

-- ==============================================================================
-- 4. Exécution immédiate pour générer les notifications des activités existantes
-- ==============================================================================
SELECT public.generate_daily_due_notifications();

