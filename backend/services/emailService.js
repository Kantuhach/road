const nodemailer = require('nodemailer');
const Setting = require('../models/Setting');
const User = require('../models/User');

async function getGlobalDoc() {
  return Setting.findOne({ key: 'global' }).lean();
}

async function getTransport() {
  const doc = await getGlobalDoc();
  if (!doc?.emailEnabled || !doc.smtpHost?.trim() || !doc.emailFrom?.trim()) {
    return { transport: null, doc };
  }
  const transport = nodemailer.createTransport({
    host: doc.smtpHost.trim(),
    port: Number(doc.smtpPort) || 587,
    secure: Boolean(doc.smtpSecure),
    auth:
      doc.smtpUser || doc.smtpPassword
        ? {
            user: (doc.smtpUser || '').trim(),
            pass: doc.smtpPassword || ''
          }
        : undefined
  });
  return { transport, doc };
}

/**
 * @param {{ to: string | string[]; subject: string; text: string; html?: string; requireConfigured?: boolean }} opts
 */
async function sendMail({ to, subject, text, html, requireConfigured = false }) {
  const { transport, doc } = await getTransport();
  if (!transport || !doc?.emailFrom?.trim()) {
    const msg = 'Email not configured or disabled in Admin → Settings.';
    if (requireConfigured) throw new Error(msg);
    console.warn('[email]', msg);
    return { sent: false };
  }

  const recipients = (Array.isArray(to) ? to : [to]).map((s) => String(s).trim()).filter(Boolean);
  if (!recipients.length) {
    if (requireConfigured) throw new Error('No recipient.');
    return { sent: false };
  }

  await transport.sendMail({
    from: doc.emailFrom.trim(),
    to: recipients.join(', '),
    subject,
    text,
    html
  });
  return { sent: true };
}

async function notifyAdminNewReport(accident) {
  const doc = await getGlobalDoc();
  const to = doc?.adminNotifyEmail?.trim();
  if (!to || !doc?.emailEnabled) return;

  const json = typeof accident.toJSON === 'function' ? accident.toJSON() : accident;
  await sendMail({
    to,
    subject: `[Ndola Roads] New report pending review: ${json.roadName || 'Incident'}`,
    text: [
      'A driver submitted a new incident report (not yet on the public map).',
      '',
      `Road: ${json.roadName}`,
      `Town: ${json.town}`,
      `Reporter: ${json.driverUsername || json.reportedBy || 'unknown'}`,
      `Severity: ${json.severity || '—'}`,
      '',
      'Approve or reject it in Admin → Incidents.'
    ].join('\n'),
    html: `<p>A new report is <strong>pending your approval</strong>.</p>
<p>${json.roadName} — ${json.town}<br/>Reporter: ${json.driverUsername || 'unknown'}</p>`
  });
}

async function notifyDriversPublishedAccident(accident) {
  const doc = await getGlobalDoc();
  if (!doc?.emailEnabled) return;

  const drivers = await User.find({ role: 'driver', email: { $nin: ['', null] } }).select('email').lean();
  const emails = [...new Set(drivers.map((u) => String(u.email).trim()).filter(Boolean))];
  if (!emails.length) return;

  const json = typeof accident.toJSON === 'function' ? accident.toJSON() : accident;
  const subject = `[Ndola Roads] Verified incident: ${json.roadName}`;
  const text = [
    'An incident has been verified and is now shown on the live map.',
    '',
    `${json.roadName} (${json.town})`,
    `Severity: ${json.severity}`,
    '',
    'Open the Ndola Roads app for route details. Drive safely.'
  ].join('\n');

  for (const email of emails) {
    try {
      await sendMail({ to: email, subject, text });
    } catch (e) {
      console.error('[email] driver notify failed:', email, e.message);
    }
  }
}

async function notifyDriversNewHotspot(hotspot) {
  const doc = await getGlobalDoc();
  if (!doc?.emailEnabled) return;

  const drivers = await User.find({ role: 'driver', email: { $nin: ['', null] } }).select('email').lean();
  const emails = [...new Set(drivers.map((u) => String(u.email).trim()).filter(Boolean))];
  if (!emails.length) return;

  const json = typeof hotspot.toJSON === 'function' ? hotspot.toJSON() : hotspot;
  const name = json.name || 'Hotspot';
  const subject = `[Ndola Roads] New hotspot: ${name}`;
  const text = [
    'RTSA published a high-risk hotspot on the map.',
    '',
    `${name}`,
    `Severity: ${json.severity}`,
    json.timePattern ? `Pattern: ${json.timePattern}` : '',
    '',
    'Check the live map before you drive.'
  ]
    .filter(Boolean)
    .join('\n');

  for (const email of emails) {
    try {
      await sendMail({ to: email, subject, text });
    } catch (e) {
      console.error('[email] hotspot notify failed:', email, e.message);
    }
  }
}

module.exports = {
  sendMail,
  notifyAdminNewReport,
  notifyDriversPublishedAccident,
  notifyDriversNewHotspot
};
