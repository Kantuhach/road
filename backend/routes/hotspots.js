const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Hotspot = require('../models/Hotspot');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const emailService = require('../services/emailService');

function broadcast(app, message) {
  if (app.locals.websocketServer) {
    app.locals.websocketServer.broadcast(message);
  }
}

router.get('/', async (_req, res) => {
  try {
    const hotspots = await Hotspot.find({ active: true }).sort({ createdAt: -1 }).lean();
    const normalized = hotspots.map((h) => ({
      ...h,
      id: h._id.toString(),
      latitude: h.latitude,
      longitude: h.longitude
    }));
    res.json(normalized);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Hotspot not found' });
    }
    const hotspot = await Hotspot.findById(req.params.id).lean();
    if (!hotspot) {
      return res.status(404).json({ error: 'Hotspot not found' });
    }
    res.json({ ...hotspot, id: hotspot._id.toString(), latitude: hotspot.latitude, longitude: hotspot.longitude });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      latitude,
      longitude,
      severity,
      description,
      timePattern,
      coordinates
    } = req.body;

    const lat = latitude ?? coordinates?.latitude;
    const lng = longitude ?? coordinates?.longitude;

    if (!name || lat == null || lng == null || !severity) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name, latitude, longitude, and severity are required'
      });
    }

    const doc = await Hotspot.create({
      name,
      latitude: Number(lat),
      longitude: Number(lng),
      severity: severity || 'Medium',
      description: description || '',
      timePattern: timePattern || ''
    });

    broadcast(req.app, {
      type: 'HOTSPOT_CREATED',
      hotspot: doc.toJSON()
    });

    emailService.notifyDriversNewHotspot(doc).catch((e) => console.error('[email] hotspot:', e.message));

    res.status(201).json({
      success: true,
      hotspot: doc.toJSON(),
      message: 'Hotspot created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Hotspot not found' });
    }

    const updates = { ...req.body };
    if (updates.coordinates) {
      updates.latitude = updates.coordinates.latitude;
      updates.longitude = updates.coordinates.longitude;
      delete updates.coordinates;
    }

    const doc = await Hotspot.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!doc) {
      return res.status(404).json({ error: 'Hotspot not found' });
    }

    broadcast(req.app, {
      type: 'HOTSPOT_UPDATED',
      hotspot: doc.toJSON()
    });

    res.json({
      success: true,
      hotspot: doc.toJSON(),
      message: 'Hotspot updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Hotspot not found' });
    }

    const doc = await Hotspot.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!doc) {
      return res.status(404).json({ error: 'Hotspot not found' });
    }

    broadcast(req.app, {
      type: 'HOTSPOT_REMOVED',
      id: req.params.id
    });

    res.json({
      success: true,
      message: 'Hotspot deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
