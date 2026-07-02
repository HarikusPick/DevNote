// DevNote — "invite-member" Edge Function
// Proje sahibinin bir e-postayı davet etmesini sağlar: davet satırını yazar
// ve Resend ile davet e-postası gönderir.
//
// Deploy: Supabase Dashboard → Edge Functions → "invite-member" (veya CLI).
// Gerekli secret'lar: RESEND_API_KEY, APP_URL, (opsiyonel) INVITE_FROM.
// SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY çalışma ortamında otomatik gelir.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Yetkisiz.' });

    const { projectId, email, role } = await req.json();
    if (!projectId || !email || !['editor', 'viewer'].includes(role)) {
      return json({ error: 'Geçersiz istek (projectId, email, role gerekli).' });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Çağıranı doğrula
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: 'Yetkisiz.' });
    const caller = userData.user;

    // Yalnızca proje sahibi davet edebilir
    const { data: membership } = await admin
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', caller.id)
      .maybeSingle();
    if (!membership || membership.role !== 'owner') {
      return json({ error: 'Yalnızca proje sahibi davet edebilir.' });
    }

    const { data: project } = await admin
      .from('projects').select('name').eq('id', projectId).maybeSingle();

    // Aynı projeye aynı e-posta için bekleyen eski daveti temizle (tekrar önle)
    await admin
      .from('project_invitations')
      .delete()
      .eq('project_id', projectId)
      .eq('email', email)
      .eq('status', 'pending');

    // Davet satırını yaz
    const { error: invErr } = await admin
      .from('project_invitations')
      .insert({ project_id: projectId, email, role, invited_by: caller.id });
    if (invErr) return json({ error: 'Davet kaydedilemedi: ' + invErr.message });

    // E-posta gönder (Resend)
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) return json({ error: 'RESEND_API_KEY ayarlı değil.' });
    const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:4200';
    const from = Deno.env.get('INVITE_FROM') ?? 'DevNote <onboarding@resend.dev>';
    const roleLabel = role === 'editor' ? 'editör' : 'görüntüleyici';
    const projectName = project?.name ?? 'bir proje';
    const link = `${appUrl}/login`;

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;color:#37352f">
        <h2 style="font-weight:600">DevNote daveti</h2>
        <p><b>${caller.email}</b> seni <b>“${projectName}”</b> projesine
        <b>${roleLabel}</b> olarak davet etti.</p>
        <p>Katılmak için hesabını oluştur (veya giriş yap) — davet otomatik tanınır:</p>
        <p><a href="${link}" style="display:inline-block;padding:10px 18px;background:#7c5cff;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">DevNote’a git</a></p>
        <p style="color:#888;font-size:13px">Bu e-postayı beklemiyorsan yok sayabilirsin.</p>
      </div>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: email,
        subject: `${caller.email} seni "${projectName}" projesine davet etti`,
        html,
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      // Davet kaydı geçerli; sadece bildirim e-postası gidemedi → uyarı dön (hata değil).
      return json({
        ok: true,
        warning:
          'Davet kaydedildi ama bildirim e-postası gönderilemedi. ' +
          '(Resend test modunda yalnızca kendi Resend e-postana gönderebilirsin; ' +
          'başka adresler için Resend’de domain doğrula.) ' +
          'Kişi yine de bu e-postayla kayıt olursa otomatik eklenir. — ' + t,
      });
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
