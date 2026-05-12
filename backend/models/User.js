const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    email: { type: String, trim: true, default: '' },
    role: { type: String, enum: ['driver', 'admin'], default: 'driver' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
