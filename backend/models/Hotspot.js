const mongoose = require('mongoose');

const hotspotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
    description: { type: String, default: '' },
    timePattern: { type: String, default: '' },
    incidentCount: { type: Number, default: 0 },
    status: { type: String, default: 'active' },
    expiresAt: { type: Date },
    active: { type: Boolean, default: true }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model('Hotspot', hotspotSchema);
