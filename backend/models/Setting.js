const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'global' },
    googleMapsApiKey: { type: String, default: '' },
    emailEnabled: { type: Boolean, default: false },
    smtpHost: { type: String, default: '' },
    smtpPort: { type: Number, default: 587 },
    smtpSecure: { type: Boolean, default: false },
    smtpUser: { type: String, default: '' },
    smtpPassword: { type: String, default: '' },
    emailFrom: { type: String, default: '' },
    adminNotifyEmail: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Setting', settingSchema);
