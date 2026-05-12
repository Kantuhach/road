const mongoose = require('mongoose');
const Setting = require('../models/Setting');

// Replace with your actual Google Maps API key
const GOOGLE_MAPS_API_KEY = 'AIzaSyAWS2Qssms3UefmhSSQquyuNfYAF7sAu00';

async function updateMapsKey() {
  try {
    // Connect to MongoDB - adjust connection string if needed
    await mongoose.connect('mongodb://localhost:27017/road-accident-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Update or create the global setting with the API key
    const setting = await Setting.findOneAndUpdate(
      { key: 'global' },
      { $set: { googleMapsApiKey: GOOGLE_MAPS_API_KEY } },
      { upsert: true, new: true }
    );

    console.log('Google Maps API key updated successfully');
    console.log('Setting:', setting);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error updating Maps API key:', error);
    process.exit(1);
  }
}

updateMapsKey();
