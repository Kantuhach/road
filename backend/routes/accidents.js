const express = require('express');
const router = express.Router();
const Accident = require('../models/Accident');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/accidents/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// GET all active accidents
router.get('/active', async (req, res) => {
  try {
    const accidents = await Accident.findActive();
    res.json(accidents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET accidents near a location
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const accidents = await Accident.findNearby(
      parseFloat(lat), 
      parseFloat(lng), 
      parseFloat(radius)
    );
    
    res.json(accidents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET accident statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Accident.getAccidentStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new accident with photo
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const accidentData = {
      ...req.body,
      photo: req.file ? req.file.path : null,
      photoUrl: req.file ? `/uploads/accidents/${req.file.filename}` : null,
      coordinates: {
        latitude: parseFloat(req.body.latitude),
        longitude: parseFloat(req.body.longitude)
      },
      severity: req.body.severity || 'Medium',
      status: 'active',
      verified: false,
      reportedBy: 'driver'
    };

    const accident = new Accident(accidentData);
    await accident.save();

    // Notify WebSocket clients
    if (req.app.locals.websocketServer) {
      req.app.locals.websocketServer.broadcast({
        type: 'ACCIDENT_REPORTED',
        accident: accident
      });
    }

    res.status(201).json({
      success: true,
      accident,
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

// PUT update accident (for verification by RTSA)
router.put('/:id', async (req, res) => {
  try {
    const accident = await Accident.findById(req.params.id);
    
    if (!accident) {
      return res.status(404).json({ error: 'Accident not found' });
    }

    // Update fields
    const updates = {
      ...req.body,
      verifiedAt: req.body.verified ? new Date() : accident.verifiedAt,
      verifiedBy: req.body.verified ? req.body.verifiedBy : accident.verifiedBy
    };

    const updatedAccident = await Accident.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    // Notify WebSocket clients
    if (req.app.locals.websocketServer) {
      req.app.locals.websocketServer.broadcast({
        type: 'ACCIDENT_UPDATE',
        accident: updatedAccident
      });
    }

    res.json({
      success: true,
      accident: updatedAccident,
      message: 'Accident updated successfully'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE accident (clear accident)
router.delete('/:id', async (req, res) => {
  try {
    const accident = await Accident.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'cleared',
        clearedAt: new Date()
      },
      { new: true }
    );

    if (!accident) {
      return res.status(404).json({ error: 'Accident not found' });
    }

    // Notify WebSocket clients
    if (req.app.locals.websocketServer) {
      req.app.locals.websocketServer.broadcast({
        type: 'ACCIDENT_CLEARED',
        accidentId: req.params.id
      });
    }

    res.json({
      success: true,
      message: 'Accident cleared successfully'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET safe routes for an accident
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

// POST safe route for an accident
router.post('/:id/routes', async (req, res) => {
  try {
    const accident = await Accident.findById(req.params.id);
    
    if (!accident) {
      return res.status(404).json({ error: 'Accident not found' });
    }

    const newRoute = {
      ...req.body,
      createdAt: new Date()
    };

    accident.safeRoutes.push(newRoute);
    await accident.save();

    // Notify WebSocket clients about new safe route
    if (req.app.locals.websocketServer) {
      req.app.locals.websocketServer.broadcast({
        type: 'SAFE_ROUTE_ADDED',
        accidentId: req.params.id,
        route: newRoute
      });
    }

    res.status(201).json({
      success: true,
      route: newRoute,
      message: 'Safe route added successfully'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all accidents (with pagination)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const accidents = await Accident.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Accident.countDocuments();

    res.json({
      accidents,
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

module.exports = router;
