const mongoose = require('mongoose');

const accidentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  roadName: {
    type: String,
    required: true,
    trim: true
  },
  town: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    required: true,
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'cleared', 'pending'],
    default: 'active'
  },
  coordinates: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  },
  // Alternative coordinate formats
  lat: {
    type: Number,
    min: -90,
    max: 90
  },
  lng: {
    type: Number,
    min: -180,
    max: 180
  },
  photo: {
    type: String, // Base64 encoded image
    required: true
  },
  photoUrl: {
    type: String // Optional URL if photo is stored externally
  },
  reportedBy: {
    type: String,
    default: 'driver'
  },
  driverUsername: {
    type: String,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  clearanceTime: {
    type: Date,
    required: true
  },
  clearedAt: {
    type: Date
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: String // RTSA admin who verified
  },
  verifiedAt: {
    type: Date
  },
  // Route information
  safeRoutes: [{
    startCoords: {
      latitude: Number,
      longitude: Number
    },
    endCoords: {
      latitude: Number,
      longitude: Number
    },
    waypoints: [{
      latitude: Number,
      longitude: Number
    }],
    distance: Number,
    estimatedTime: Number,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Traffic impact
  trafficImpact: {
    type: String,
    enum: ['low', 'medium', 'high', 'severe'],
    default: 'medium'
  },
  lanesBlocked: {
    type: Number,
    min: 0,
    max: 4,
    default: 1
  },
  // Weather conditions
  weatherConditions: {
    type: String,
    enum: ['clear', 'cloudy', 'rainy', 'foggy', 'stormy'],
    default: 'clear'
  },
  visibility: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Indexes for better query performance
accidentSchema.index({ status: 1, clearanceTime: 1 });
accidentSchema.index({ coordinates: '2dsphere' });
accidentSchema.index({ timestamp: -1 });
accidentSchema.index({ severity: 1 });

// Virtual fields
accidentSchema.virtual('isActive').get(function() {
  return this.status === 'active' && new Date() < new Date(this.clearanceTime);
});

accidentSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const clearance = new Date(this.clearanceTime);
  const diff = clearance - now;
  
  if (diff <= 0) return 'CLEARED';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return `${hours}h ${minutes}m ${seconds}s`;
});

// Pre-save middleware to ensure coordinate consistency
accidentSchema.pre('save', function(next) {
  // Ensure we have both coordinate formats
  if (this.coordinates && this.coordinates.latitude && this.coordinates.longitude) {
    this.lat = this.coordinates.latitude;
    this.lng = this.coordinates.longitude;
  } else if (this.lat && this.lng) {
    this.coordinates = {
      latitude: this.lat,
      longitude: this.lng
    };
  }
  
  // Set default clearance time (1 hour from now)
  if (!this.clearanceTime) {
    this.clearanceTime = new Date(Date.now() + 60 * 60 * 1000);
  }
  
  next();
});

// Static methods
accidentSchema.statics.findActive = function() {
  return this.find({
    status: 'active',
    clearanceTime: { $gt: new Date() }
  }).sort({ timestamp: -1 });
};

accidentSchema.statics.findNearby = function(latitude, longitude, radiusKm = 5) {
  return this.find({
    coordinates: {
      $near: [longitude, latitude],
      $maxDistance: radiusKm * 1000
    },
    status: 'active',
    clearanceTime: { $gt: new Date() }
  });
};

accidentSchema.statics.getAccidentStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$severity',
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'active'] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Accident', accidentSchema);
