const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    email: { type: String, trim: true, default: '', lowercase: true },
    role: { type: String, enum: ['driver', 'admin'], default: 'driver' }
  },
  { timestamps: true }
);

userSchema.pre('save', function normalizeEmail(next) {
  if (this.email != null && typeof this.email === 'string') {
    this.email = this.email.trim().toLowerCase();
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
