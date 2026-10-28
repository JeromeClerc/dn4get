// ==============================================================================
// Supabase Edge Function : send-due-notification
// Déclenchée par un Database Webhook sur INSERT dans `public.notifications`
// Envoie un Email (via Resend) et/ou un SMS (via Twilio) à l'utilisateur
// ==============================================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Secrets optionnels pour Email (Resend)
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const NOTIFICATION_FROM_EMAIL = Deno.env.get('NOTIFICATION_FROM_EMAIL') ?? 'Dn4Get <onboarding@resend.dev>';

// Secrets optionnels pour SMS (Twilio)
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') ?? '';
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN') ?? '';
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER') ?? '';

serve(async (req: Request) => {
  try {
    const payload = await req.json();
    // Format Database Webhook Supabase : { type: 'INSERT', table: 'notifications', record: { ... } }
    const notification = payload.record || payload;

    if (!notification || !notification.user_id) {
      return new Response(JSON.stringify({ error: 'Payload invalide' }), { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Récupérer le profil de l'utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, display_name, phone_number, email_notifications_enabled, phone_notifications_enabled')
      .eq('id', notification.user_id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profil utilisateur introuvable' }), { status: 404 });
    }

    const results: Record<string, unknown> = {};

    // 1. Envoi par Email via Resend (si configuré et activé)
    if (RESEND_API_KEY && profile.email && profile.email_notifications_enabled !== false) {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: NOTIFICATION_FROM_EMAIL,
          to: [profile.email],
          subject: `[Dn4Get] ${notification.title}`,
          html: `
            <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
              <h2 style="color: #2563eb; margin-top: 0;">🔔 ${notification.title}</h2>
              <p style="color: #334155; font-size: 15px; line-height: 1.5;">${notification.message}</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="color: #64748b; font-size: 12px;">Dn4Get (Do Not Forget) - Gestionnaire d'activités professionnelles</p>
            </div>
          `,
        }),
      });
      results.email = await emailRes.json();
    }

    // 2. Envoi par SMS via Twilio (si configuré et activé)
    if (
      TWILIO_ACCOUNT_SID &&
      TWILIO_AUTH_TOKEN &&
      TWILIO_PHONE_NUMBER &&
      profile.phone_number &&
      profile.phone_notifications_enabled
    ) {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
      const bodyParams = new URLSearchParams({
        To: profile.phone_number,
        From: TWILIO_PHONE_NUMBER,
        Body: `[Dn4Get] ${notification.title} : ${notification.message}`,
      });

      const smsRes = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });
      results.sms = await smsRes.json();
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

