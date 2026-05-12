const mongoose = require('mongoose');

const accidentSchema = new mongoose.Schema(
  {
    roadName: { type: String, required: true, trim: true },
    town: { type: String, required: true, trim: true },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: ['active', 'resolved', 'cleared', 'pending'],
      default: 'pending'
    },
    coordinates: {
      latitude: { type: Number, required: true, min: -90, max: 90 },
      longitude: { type: Number, required: true, min: -180, max: 180 }
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: undefined }
    },
    lat: { type: Number },
    lng: { type: Number },
    photo: { type: String, default: '' },
    photoUrl: { type: String },
    reportedBy: { type: String, default: 'driver' },
    driverUsername: { type: String, trim: true },
    clearanceTime: { type: Date },
    clearedAt: { type: Date },
    verified: { type: Boolean, default: false },
    verifiedBy: { type: String },
    verifiedAt: { type: Date },
    verificationReason: { type: String },
    verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    imageValidated: { type: Boolean, default: false },
    safeRoutes: [
      {
        startCoords: { latitude: Number, longitude: Number },
        endCoords: { latitude: Number, longitude: Number },
        waypoints: [{ latitude: Number, longitude: Number }],
        distance: Number,
        estimatedTime: Number,
        createdAt: { type: Date, default: Date.now }
      }
    ],
    trafficImpact: {
      type: String,
      enum: ['low', 'medium', 'high', 'severe'],
      default: 'medium'
    },
    lanesBlocked: { type: Number, min: 0, max: 4, default: 1 },
    weatherConditions: {
      type: String,
      enum: ['clear', 'cloudy', 'rainy', 'foggy', 'stormy'],
      default: 'clear'
    },
    visibility: { type: Number, min: 0, max: 100, default: 100 }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.latitude = doc.coordinates?.latitude ?? doc.lat;
        ret.longitude = doc.coordinates?.longitude ?? doc.lng;
        delete ret.__v;
        return ret;
      }
    }
  }
);

accidentSchema.index({ location: '2dsphere' });
accidentSchema.index({ status: 1, clearanceTime: 1 });
accidentSchema.index({ createdAt: -1 });

accidentSchema.pre('validate', function syncGeo(next) {
  if (this.coordinates?.latitude != null && this.coordinates?.longitude != null) {
    this.lat = this.coordinates.latitude;
    this.lng = this.coordinates.longitude;
    this.location = {
      type: 'Point',
      coordinates: [this.coordinates.longitude, this.coordinates.latitude]
    };
  }
  if (!this.clearanceTime) {
    this.clearanceTime = new Date(Date.now() + 60 * 60 * 1000);
  }
  next();
});

accidentSchema.statics.findActive = function findActive() {
  return this.find({
    status: { $in: ['active', 'pending'] },
    clearanceTime: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

accidentSchema.statics.findNearby = function findNearby(latitude, longitude, radiusKm = 5) {
  return this.find({
    location: {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: radiusKm * 1000
      }
    },
    status: { $in: ['active', 'pending'] },
    clearanceTime: { $gt: new Date() }
  });
};

accidentSchema.statics.getAccidentStats = async function getAccidentStats() {
  const [total, active, pending, resolved] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ status: 'active' }),
    this.countDocuments({ status: 'pending' }),
    this.countDocuments({ status: { $in: ['resolved', 'cleared'] } })
  ]);
  return { total, active, pending, resolved };
};

module.exports = mongoose.model('Accident', accidentSchema);
