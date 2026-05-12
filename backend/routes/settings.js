const express = require('express');
const Setting = require('../models/Setting');
const { verifyToken, requireAdmin } = require('../middleware/auth');

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

module.exports = router;
