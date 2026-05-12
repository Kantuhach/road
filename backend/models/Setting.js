const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'global' },
    googleMapsApiKey: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Setting', settingSchema);
