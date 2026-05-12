const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Hotspot = require('../models/Hotspot');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/road-accident-system';

async function seed() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  console.log('Connected:', MONGODB_URI);

  await User.deleteMany({});
  await Hotspot.deleteMany({});

  await User.insertMany([
    {
      username: 'driver1',
      passwordHash: bcrypt.hashSync('password123', 10),
      email: 'driver@example.com',
      role: 'driver'
    },
    {
      username: 'rtsa_admin',
      passwordHash: bcrypt.hashSync('rtsa2024!', 10),
      email: 'admin@example.com',
      role: 'admin'
    }
  ]);

  await Hotspot.insertMany([
    {
      name: 'Ndola Central Roundabout',
      latitude: -12.8056,
      longitude: 28.66,
      severity: 'High',
      description: 'High traffic area with frequent congestion',
      timePattern: 'Weekday peaks',
      incidentCount: 12,
      status: 'active'
    },
    {
      name: 'Kansenshi Highway Junction',
      latitude: -12.835,
      longitude: 28.65,
      severity: 'Medium',
      description: 'Intersection accident hotspot',
      timePattern: 'Late afternoon',
      incidentCount: 7,
      status: 'active'
    },
    {
      name: 'Chifubu Market Area',
      latitude: -12.82,
      longitude: 28.63,
      severity: 'Low',
      description: 'Urban area with moderate risk',
      timePattern: 'Market days',
      incidentCount: 4,
      status: 'active'
    }
  ]);

  console.log('Seed complete.');
  console.log('Drivers: driver1 / password123');
  console.log('Admin: rtsa_admin / rtsa2024!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
