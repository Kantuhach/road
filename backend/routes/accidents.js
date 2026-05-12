const express = require('express');
const router = express.Router();
const Accident = require('../models/Accident');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { verifyToken, requireAdmin, optionalVerifyToken } = require('../middleware/auth');
const emailService = require('../services/emailService');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/accidents/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

function broadcast(app, message) {
  if (app.locals.websocketServer) {
    app.locals.websocketServer.broadcast(message);
  }
}

router.get('/', optionalVerifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const isAdmin = req.user?.role === 'admin';
    const query = isAdmin
      ? {}
      : {
          verified: true,
          verificationStatus: 'approved',
          status: 'active',
          clearanceTime: { $gt: new Date() }
        };

    const accidents = await Accident.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await Accident.countDocuments(query);

    res.json({
      accidents: accidents.map((a) => a.toJSON()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/active', async (req, res) => {
  try {
    const accidents = await Accident.findActive();
    res.json(accidents.map((a) => a.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }
    const accidents = await Accident.findNearby(parseFloat(lat), parseFloat(lng), parseFloat(radius));
    res.json(accidents.map((a) => a.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const stats = await Accident.getAccidentStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const lat = parseFloat(req.body.latitude);
    const lng = parseFloat(req.body.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ error: 'Valid latitude and longitude required' });
    }

    const driverUsername = req.body.driverUsername || req.body.reporterName || 'driver';

    const accident = await Accident.create({
      roadName: req.body.roadName || 'Unknown road',
      town: req.body.town || 'Ndola',
      description: req.body.description || '',
      severity: req.body.severity || 'Medium',
      status: 'pending',
      verified: false,
      verificationStatus: 'pending',
      coordinates: { latitude: lat, longitude: lng },
      reportedBy: 'driver',
      driverUsername,
      photo: req.file ? req.file.filename : '',
      photoUrl: req.file ? `/uploads/accidents/${req.file.filename}` : ''
    });

    emailService.notifyAdminNewReport(accident).catch((e) => console.error('[email] admin notify:', e.message));

    res.status(201).json({
      success: true,
      accident: accident.toJSON(),
      message: 'Accident reported successfully'
    });
  } catch (error) {
    console.error('Error creating accident:', error);
    res.status(500).json({
      error: 'Failed to report accident',
      message: error.message
    });
  }
});

router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const accident = await Accident.findById(req.params.id);
    if (!accident) {
      return res.status(404).json({ error: 'Accident not found' });
    }

    const prevApproved =
      accident.verified &&
      accident.verificationStatus === 'approved' &&
      accident.status === 'active';

    const updates = { ...req.body };
    delete updates._id;

    if (updates.latitude != null && updates.longitude != null) {
      updates.coordinates = {
        latitude: parseFloat(updates.latitude),
        longitude: parseFloat(updates.longitude)
      };
      delete updates.latitude;
      delete updates.longitude;
    }

    if (updates.verified === true) {
      updates.verifiedAt = new Date();
      updates.verificationStatus = 'approved';
      if (updates.status !== 'resolved' && updates.status !== 'cleared') {
        updates.status = 'active';
      }
    }

    if (updates.verified === false && updates.verificationStatus === 'rejected') {
      updates.status = updates.status || 'cleared';
    }

    Object.assign(accident, updates);
    await accident.save();

    const nowApproved =
      accident.verified &&
      accident.verificationStatus === 'approved' &&
      accident.status === 'active';
    const newlyPublished = !prevApproved && nowApproved;

    if (prevApproved && !nowApproved) {
      broadcast(req.app, {
        type: 'ACCIDENT_CLEARED',
        accidentId: accident._id.toString()
      });
    }

    broadcast(req.app, {
      type: 'ACCIDENT_UPDATE',
      accident: accident.toJSON(),
      ...(newlyPublished && { newlyPublished: true })
    });

    if (newlyPublished) {
      emailService.notifyDriversPublishedAccident(accident).catch((e) => console.error('[email] drivers:', e.message));
    }

    res.json({
      success: true,
      accident: accident.toJSON(),
      message: 'Accident updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const accident = await Accident.findByIdAndUpdate(
      req.params.id,
      {
        status: 'cleared',
        clearedAt: new Date(),
        clearanceTime: new Date()
      },
      { new: true }
    );

    if (!accident) {
      return res.status(404).json({ error: 'Accident not found' });
    }

    broadcast(req.app, {
      type: 'ACCIDENT_CLEARED',
      accidentId: accident._id.toString()
    });

    res.json({
      success: true,
      message: 'Accident cleared successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/routes', async (req, res) => {
  try {
    const accident = await Accident.findById(req.params.id);
    if (!accident) {
      return res.status(404).json({ error: 'Accident not found' });
    }
    res.json({
      accidentId: req.params.id,
      safeRoutes: accident.safeRoutes || [],
      message: 'Safe routes retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/routes', verifyToken, requireAdmin, async (req, res) => {
  try {
    const accident = await Accident.findById(req.params.id);
    if (!accident) {
      return res.status(404).json({ error: 'Accident not found' });
    }
    accident.safeRoutes.push({
      ...req.body,
      createdAt: new Date()
    });
    await accident.save();

    broadcast(req.app, {
      type: 'SAFE_ROUTE_ADDED',
      accidentId: req.params.id,
      route: accident.safeRoutes[accident.safeRoutes.length - 1]
    });

    res.status(201).json({
      success: true,
      route: accident.safeRoutes[accident.safeRoutes.length - 1],
      message: 'Safe route added successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
