/**
 * Canal SMS — Twilio. Requiere:
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM (número o Messaging Service SID)
 * Sin credenciales: simula envío.
 */
async function sendSms({ to, body }) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from) {
    console.warn('[sms] credenciales no configuradas, simulando envío a', to);
    return { providerMessageId: null, raw: { simulated: true } };
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const form = new URLSearchParams({ To: String(to), From: from, Body: String(body || '') });
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`twilio ${res.status}: ${data.message || JSON.stringify(data)}`);
    err.code = data.code ? `TWILIO_${data.code}` : `HTTP_${res.status}`;
    err.raw = data;
    throw err;
  }
  return { providerMessageId: data.sid || null, raw: data };
}

module.exports = { sendSms };
