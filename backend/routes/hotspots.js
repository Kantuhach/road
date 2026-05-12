const express = require('express');
const router = express.Router();

// Mock hotspot data (in production, get from database)
const hotspots = [
  {
    id: 1,
    name: 'Ndola Central Roundabout',
    coordinates: {
      latitude: -12.8056,
      longitude: 28.6600
    },
    severity: 'High',
    description: 'High traffic area with frequent accidents',
    active: true
  },
  {
    id: 2,
    name: 'Kansenshi Highway Junction',
    coordinates: {
      latitude: -12.8350,
      longitude: 28.6500
    },
    severity: 'Medium',
    description: 'Intersection accident hotspot',
    active: true
  },
  {
    id: 3,
    name: 'Chifubu Market Area',
    coordinates: {
      latitude: -12.8200,
      longitude: 28.6300
    },
    severity: 'Low',
    description: 'Urban area with moderate risk',
    active: true
  }
];

// GET all hotspots
router.get('/', (req, res) => {
  res.json(hotspots);
});

// GET hotspot by ID
router.get('/:id', (req, res) => {
  const hotspot = hotspots.find(h => h.id === parseInt(req.params.id));
  
  if (!hotspot) {
    return res.status(404).json({ 
      error: 'Hotspot not found',
      message: `Hotspot with ID ${req.params.id} not found` 
    });
  }

  res.json(hotspot);
});

// POST new hotspot
router.post('/', (req, res) => {
  const { name, coordinates, severity, description } = req.body;

  // Validation
  if (!name || !coordinates || !severity) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      message: 'Name, coordinates, and severity are required' 
    });
  }

  const newHotspot = {
    id: hotspots.length + 1,
    name,
    coordinates,
    severity: severity || 'Medium',
    description: description || '',
    active: true,
    createdAt: new Date().toISOString()
  };

  hotspots.push(newHotspot);

  res.status(201).json({
    success: true,
    hotspot: newHotspot,
    message: 'Hotspot created successfully'
  });
});

// PUT update hotspot
router.put('/:id', (req, res) => {
  const hotspotIndex = hotspots.findIndex(h => h.id === parseInt(req.params.id));
  
  if (hotspotIndex === -1) {
    return res.status(404).json({ 
      error: 'Hotspot not found',
      message: `Hotspot with ID ${req.params.id} not found` 
    });
  }

  const updatedHotspot = {
    ...hotspots[hotspotIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  hotspots[hotspotIndex] = updatedHotspot;

  res.json({
    success: true,
    hotspot: updatedHotspot,
    message: 'Hotspot updated successfully'
  });
});

// DELETE hotspot
router.delete('/:id', (req, res) => {
  const hotspotIndex = hotspots.findIndex(h => h.id === parseInt(req.params.id));
  
  if (hotspotIndex === -1) {
    return res.status(404).json({ 
      error: 'Hotspot not found',
      message: `Hotspot with ID ${req.params.id} not found` 
    });
  }

  hotspots.splice(hotspotIndex, 1);

  res.json({
    success: true,
    message: 'Hotspot deleted successfully'
  });
});

module.exports = router;
