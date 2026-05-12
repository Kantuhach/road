const express = require('express');
const Setting = require('../models/Setting');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

async function getOrCreateGlobal() {
  let doc = await Setting.findOne({ key: 'global' });
  if (!doc) {
    doc = await Setting.create({ key: 'global', googleMapsApiKey: '' });
  }
  return doc;
}

/** Public read — browsers must embed this key for Maps JS anyway (restrict in GCP console). */
router.get('/maps', async (_req, res) => {
  try {
    const doc = await getOrCreateGlobal();
    res.json({
      googleMapsApiKey: doc.googleMapsApiKey ? doc.googleMapsApiKey.trim() : ''
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put('/maps', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { googleMapsApiKey } = req.body;
    if (typeof googleMapsApiKey !== 'string') {
      return res.status(400).json({ message: 'googleMapsApiKey must be a string' });
    }

    const doc = await Setting.findOneAndUpdate(
      { key: 'global' },
      { $set: { googleMapsApiKey: googleMapsApiKey.trim() } },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      hasKey: Boolean(doc.googleMapsApiKey && doc.googleMapsApiKey.trim())
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/email', verifyToken, requireAdmin, async (_req, res) => {
  try {
    const doc = await getOrCreateGlobal();
    res.json({
      emailEnabled: Boolean(doc.emailEnabled),
      smtpHost: doc.smtpHost || '',
      smtpPort: doc.smtpPort ?? 587,
      smtpSecure: Boolean(doc.smtpSecure),
      smtpUser: doc.smtpUser || '',
      hasSmtpPassword: Boolean(doc.smtpPassword && String(doc.smtpPassword).length > 0),
      emailFrom: doc.emailFrom || '',
      adminNotifyEmail: doc.adminNotifyEmail || ''
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put('/email', verifyToken, requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const $set = {
      emailEnabled: Boolean(body.emailEnabled),
      smtpHost: typeof body.smtpHost === 'string' ? body.smtpHost.trim() : '',
      smtpPort: Number(body.smtpPort) || 587,
      smtpSecure: Boolean(body.smtpSecure),
      smtpUser: typeof body.smtpUser === 'string' ? body.smtpUser.trim() : '',
      emailFrom: typeof body.emailFrom === 'string' ? body.emailFrom.trim() : '',
      adminNotifyEmail: typeof body.adminNotifyEmail === 'string' ? body.adminNotifyEmail.trim() : ''
    };
    if (typeof body.smtpPassword === 'string' && body.smtpPassword.length > 0) {
      $set.smtpPassword = body.smtpPassword;
    }

    await Setting.findOneAndUpdate({ key: 'global' }, { $set }, { upsert: true, new: true });

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/email/test', verifyToken, requireAdmin, async (req, res) => {
  try {
    const to = typeof req.body?.to === 'string' ? req.body.to.trim() : '';
    if (!to) {
      return res.status(400).json({ message: 'Provide a `to` email address in the request body.' });
    }
    await emailService.sendMail({
      to,
      subject: '[Ndola Roads] Test email',
      text: 'Your SMTP settings are working.',
      requireConfigured: true
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Send failed' });
  }
});

module.exports = router;
