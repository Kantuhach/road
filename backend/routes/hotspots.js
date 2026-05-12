const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Hotspot = require('../models/Hotspot');

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

router.post('/', async (req, res) => {
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

    res.status(201).json({
      success: true,
      hotspot: doc.toJSON(),
      message: 'Hotspot created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
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

    res.json({
      success: true,
      hotspot: doc.toJSON(),
      message: 'Hotspot updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Hotspot not found' });
    }

    const doc = await Hotspot.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!doc) {
      return res.status(404).json({ error: 'Hotspot not found' });
    }

    res.json({
      success: true,
      message: 'Hotspot deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
