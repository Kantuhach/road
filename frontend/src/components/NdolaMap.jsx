import { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import { MapContainer } from 'react-leaflet';
import MarkerClusterGroup from 'leaflet.markercluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import AccidentReporter from './AccidentReporter';
import RealTimeAccidents from './RealTimeAccidents';
import websocketService from '../services/websocketService';

// Proximity alert system
const PROXIMITY_THRESHOLD = 500; // meters
const BUZZ_INTERVAL = 2000; // milliseconds
const BUZZ_FREQUENCY = 800; // Hz
const BUZZ_DURATION = 300; // milliseconds

// Ndola coordinates
const NDOLA_CENTER = [-12.8056, 28.6600];

// Major towns and areas in Ndola region
const TOWNS_DATA = [
  { name: 'Ndola Central', coords: [-12.8056, 28.6600], type: 'hub', population: 'central' },
  { name: 'Kansenshi', coords: [-12.8350, 28.6500], type: 'district', population: 'high' },
  { name: 'Chifubu', coords: [-12.8200, 28.6300], type: 'district', population: 'high' },
  { name: 'Lubuto', coords: [-12.8300, 28.7300], type: 'district', population: 'medium' },
  { name: 'Twapia', coords: [-12.8450, 28.7050], type: 'district', population: 'medium' },
  { name: 'Ndeke', coords: [-12.8600, 28.7200], type: 'district', population: 'medium' },
  { name: 'Itawa', coords: [-12.8500, 28.6800], type: 'district', population: 'medium' },
  { name: 'Masala', coords: [-12.8400, 28.7000], type: 'district', population: 'high' },
  { name: 'Chipulukusu', coords: [-12.8400, 28.6800], type: 'district', population: 'medium' },
  { name: 'Boma', coords: [-12.8100, 28.7100], type: 'district', population: 'low' },
  { name: 'Kamwala', coords: [-12.7800, 28.5900], type: 'district', population: 'low' },
  { name: 'Kawama', coords: [-12.8250, 28.6800], type: 'district', population: 'medium' },
  { name: 'Mapalo', coords: [-12.8150, 28.6900], type: 'district', population: 'medium' }
];

// Google Maps style interconnected road network with proper junctions
const ROADS_DATA = [
  // Major Highways - Main arteries
  {
    name: 'T3 Highway (Kitwe Road)',
    type: 'highway',
    coords: [
      [-12.7400, 28.5500], [-12.7600, 28.5700], [-12.7800, 28.5900], 
      [-12.7950, 28.6100], [-12.8056, 28.6300], // Main intersection with M6
      [-12.8200, 28.6500], [-12.8350, 28.6700], [-12.8500, 28.6900], 
      [-12.8700, 28.7200], [-12.8900, 28.7500]
    ],
    severity: 'low',
    description: 'Major north-south highway connecting to Kitwe',
    connects: ['Kamwala', 'Kansenshi', 'Chifubu', 'Lubuto']
  },
  {
    name: 'M6 Highway (Mufulira Road)',
    type: 'highway',
    coords: [
      [-12.9200, 28.6400], [-12.9000, 28.6450], [-12.8800, 28.6500], 
      [-12.8600, 28.6550], [-12.8400, 28.6600], [-12.8200, 28.6650], 
      [-12.8056, 28.6700], // Main intersection with T3
      [-12.8000, 28.6750], [-12.7800, 28.6800], [-12.7600, 28.6850]
    ],
    severity: 'low',
    description: 'Major east-west highway connecting to Luanshya',
    connects: ['Itawa', 'Masala', 'Chipulukusu', 'Kawama', 'Kamwala']
  },
  
  // Main Arterial Roads - Connect to highways
  {
    name: 'Independence Avenue',
    type: 'main',
    coords: [
      [-12.7950, 28.6300], [-12.8000, 28.6400], [-12.8056, 28.6500], // Connects to T3
      [-12.8100, 28.6600], [-12.8150, 28.6700], [-12.8200, 28.6800] // Connects to M6
    ],
    severity: 'medium',
    description: 'Main east-west arterial through city center',
    connects: ['Kansenshi', 'Ndola Central', 'Chifubu']
  },
  {
    name: 'President Avenue',
    type: 'main',
    coords: [
      [-12.8056, 28.6400], [-12.8056, 28.6500], [-12.8056, 28.6600], // Main spine
      [-12.8056, 28.6700], [-12.8056, 28.6800], [-12.8056, 28.6900] // Connects to M6
    ],
    severity: 'medium',
    description: 'Central north-south arterial',
    connects: ['Boma', 'Ndola Central', 'Masala']
  },
  
  // Connecting Roads - Link major roads together
  {
    name: 'Chimwemwe Road',
    type: 'main',
    coords: [
      [-12.8200, 28.6200], [-12.8220, 28.6300], [-12.8250, 28.6400],
      [-12.8300, 28.6500], [-12.8350, 28.6600] // Connects to Independence Ave
    ],
    severity: 'medium',
    description: 'Connects Chifubu to city center',
    connects: ['Chifubu', 'Ndola Central']
  },
  {
    name: 'Kansenshi Bypass',
    type: 'main',
    coords: [
      [-12.8300, 28.6400], [-12.8350, 28.6450], [-12.8400, 28.6500],
      [-12.8450, 28.6550], [-12.8500, 28.6600] // Connects to T3
    ],
    severity: 'medium',
    description: 'Bypass road through Kansenshi',
    connects: ['Kansenshi', 'Ndola Central', 'Masala']
  },
  {
    name: 'Lubuto Main Road',
    type: 'main',
    coords: [
      [-12.8250, 28.6800], [-12.8300, 28.6900], [-12.8350, 28.7000],
      [-12.8400, 28.7100], [-12.8450, 28.7200], [-12.8500, 28.7300] // Connects to T3
    ],
    severity: 'medium',
    description: 'Main road through Lubuto district',
    connects: ['Masala', 'Lubuto', 'Twapia']
  },
  {
    name: 'Twapia Spine',
    type: 'main',
    coords: [
      [-12.8450, 28.6900], [-12.8500, 28.7000], [-12.8550, 28.7100],
      [-12.8600, 28.7200], [-12.8650, 28.7300], [-12.8700, 28.7400] // Connects to M6
    ],
    severity: 'medium',
    description: 'Main north-south road in Twapia',
    connects: ['Lubuto', 'Twapia', 'Ndeke']
  },
  {
    name: 'Itawa Connector',
    type: 'main',
    coords: [
      [-12.8600, 28.6700], [-12.8650, 28.6750], [-12.8700, 28.6800],
      [-12.8750, 28.6850], [-12.8800, 28.6900] // Connects to M6
    ],
    severity: 'medium',
    description: 'Connects Itawa to main network',
    connects: ['Ndeke', 'Itawa', 'Masala']
  },
  
  // Cross-Connecting Roads - Create grid network
  {
    name: 'George Road',
    type: 'main',
    coords: [
      [-12.7950, 28.6400], [-12.8000, 28.6450], [-12.8056, 28.6500], // Connects to President Ave
      [-12.8100, 28.6550], [-12.8150, 28.6600], [-12.8200, 28.6650] // Connects to Independence Ave
    ],
    severity: 'medium',
    description: 'Cross-connects President Ave to Independence Ave',
    connects: ['Kansenshi', 'Ndola Central']
  },
  {
    name: 'Masala Link Road',
    type: 'main',
    coords: [
      [-12.8400, 28.6800], [-12.8450, 28.6850], [-12.8500, 28.6900], // Connects to T3
      [-12.8550, 28.6950], [-12.8600, 28.7000] // Connects to Twapia Spine
    ],
    severity: 'medium',
    description: 'Links Masala to Twapia',
    connects: ['Masala', 'Twapia']
  },
  {
    name: 'Chipulukusu Cross Road',
    type: 'main',
    coords: [
      [-12.8350, 28.6700], [-12.8400, 28.6750], [-12.8450, 28.6800], // Connects to Independence Ave
      [-12.8500, 28.6850], [-12.8550, 28.6900] // Connects to M6
    ],
    severity: 'medium',
    description: 'Cross-connects Chipulukusu area',
    connects: ['Chipulukusu', 'Masala']
  },
  
  // Secondary Roads - Complete the network
  {
    name: 'Kawama Link Road',
    type: 'secondary',
    coords: [
      [-12.8150, 28.6700], [-12.8200, 28.6750], [-12.8250, 28.6800] // Connects to President Ave
    ],
    severity: 'low',
    description: 'Connects Kawama to President Ave',
    connects: ['Kawama', 'Ndola Central']
  },
  {
    name: 'Mapalo Access Road',
    type: 'secondary',
    coords: [
      [-12.8100, 28.6800], [-12.8150, 28.6850], [-12.8200, 28.6900] // Connects to President Ave
    ],
    severity: 'low',
    description: 'Access road to Mapalo area',
    connects: ['Boma', 'Mapalo']
  },
  {
    name: 'Ndeke Industrial Road',
    type: 'secondary',
    coords: [
      [-12.8700, 28.7100], [-12.8750, 28.7150], [-12.8800, 28.7200] // Connects to Twapia Spine
    ],
    severity: 'low',
    description: 'Industrial area access road',
    connects: ['Twapia', 'Ndeke']
  },
  {
    name: 'Kamwala Rural Road',
    type: 'secondary',
    coords: [
      [-12.7700, 28.6000], [-12.7750, 28.6050], [-12.7800, 28.6100] // Connects to T3
    ],
    severity: 'low',
    description: 'Rural access to Kamwala',
    connects: ['Kamwala', 'T3 Highway']
  },
  {
    name: 'Boma Connector',
    type: 'secondary',
    coords: [
      [-12.8100, 28.7100], [-12.8120, 28.7000], [-12.8140, 28.6900], // Connects to President Ave
      [-12.8160, 28.6800], [-12.8180, 28.6700] // Connects to Independence Ave
    ],
    severity: 'low',
    description: 'Links Boma to main network',
    connects: ['Boma', 'Ndola Central']
  }
];

// Custom marker icons
const createAccidentMarker = (severity, status = 'active') => {
  const severityMap = { Low: '#22c55e', Medium: '#eab308', High: '#ef4444', Critical: '#dc2626' };
  const color = severityMap[severity] || '#ef4444';
  const statusOpacity = status === 'resolved' ? '0.6' : '1';
  
  return L.divIcon({
    html: `<div style="
      background: ${color};
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s infinite;
      box-shadow: 0 0 15px ${color};
      font-size: 20px;
      color: white;
      font-weight: bold;
      opacity: ${statusOpacity};
      position: relative;
    ">⚠
      ${status === 'resolved' ? '<div style="position: absolute; top: -2px; right: -2px; background: #6b7280; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;">✓</div>' : ''}
    </div>`,
    className: 'accident-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

const createUserMarker = () => {
  return L.divIcon({
    html: `<div style="
      background: #3b82f6;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 15px #3b82f6;
    "></div>`,
    className: 'user-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

const createTownMarker = (type, population) => {
  const sizeMap = { hub: 16, high: 12, medium: 10, low: 8 };
  const colorMap = { hub: '#f59e0b', high: '#8b5cf6', medium: '#3b82f6', low: '#6b7280' };
  const size = sizeMap[population] || 10;
  const color = colorMap[population] || '#6b7280';
  
  return L.divIcon({
    html: `<div style="
      background: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 8px ${color};
      position: relative;
    "></div>`,
    className: 'town-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

export default function NdolaMap({ hotspots, accidents, onRoadClick, onNearbyAccident }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedRoad, setSelectedRoad] = useState(null);
  const [selectedTown, setSelectedTown] = useState(null);
  const [alternativeRoute, setAlternativeRoute] = useState(null);
  const [showClustering, setShowClustering] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const accidentMarkersRef = useRef({});
  const markerClusterGroupRef = useRef(null);
  const routeLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const roadsLayerRef = useRef({});
  const heatmapLayerRef = useRef(null);
  
  // Proximity alert system state
  const [isNearHotspot, setIsNearHotspot] = useState(false);
  const [proximityAlert, setProximityAlert] = useState(null);
  const buzzIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const lastBuzzTimeRef = useRef(0);
  
  // Real-time accident system state
  const [realTimeAccidents, setRealTimeAccidents] = useState([]);
  const [showAccidentReporter, setShowAccidentReporter] = useState(false);
  const [safeRoute, setSafeRoute] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Proximity alert functions
  const initializeAudioContext = () => {
    if (!audioContextRef.current && typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  };

  const playBuzzSound = () => {
    if (!audioContextRef.current) return;
    
    const currentTime = Date.now();
    if (currentTime - lastBuzzTimeRef.current < BUZZ_INTERVAL) return;
    
    lastBuzzTimeRef.current = currentTime;
    
    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.value = BUZZ_FREQUENCY;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + BUZZ_DURATION / 1000);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + BUZZ_DURATION / 1000);
    } catch (error) {
      console.error('Error playing buzz sound:', error);
    }
  };


  const checkProximityToHotspots = (userLat, userLon) => {
    if (!hotspots || hotspots.length === 0) return null;
    
    let nearestHotspot = null;
    let minDistance = Infinity;
    
    hotspots.forEach(hotspot => {
      const distance = calculateDistance(
        userLat, userLon,
        hotspot.latitude || hotspot.lat,
        hotspot.longitude || hotspot.lon
      ) * 1000; // Convert km to meters
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestHotspot = { ...hotspot, distance };
      }
    });
    
    if (minDistance <= PROXIMITY_THRESHOLD) {
      return nearestHotspot;
    }
    
    return null;
  };

  const startProximityAlerts = () => {
    if (buzzIntervalRef.current) return;
    
    buzzIntervalRef.current = setInterval(() => {
      if (isNearHotspot) {
        playBuzzSound();
      }
    }, BUZZ_INTERVAL);
  };

  const stopProximityAlerts = () => {
    if (buzzIntervalRef.current) {
      clearInterval(buzzIntervalRef.current);
      buzzIntervalRef.current = null;
    }
  };

  // Initialize audio context on user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      initializeAudioContext();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
    
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  // Check proximity when user location or hotspots change
  useEffect(() => {
    if (!userLocation || !hotspots) return;
    
    const [userLat, userLon] = userLocation;
    const nearbyHotspot = checkProximityToHotspots(userLat, userLon);
    
    if (nearbyHotspot) {
      setIsNearHotspot(true);
      setProximityAlert(nearbyHotspot);
      startProximityAlerts();
      
      // Notify parent component
      if (onNearbyAccident) {
        onNearbyAccident(nearbyHotspot);
      }
    } else {
      setIsNearHotspot(false);
      setProximityAlert(null);
      stopProximityAlerts();
    }
  }, [userLocation, hotspots, onNearbyAccident]);

  // Define handler functions outside useEffect to make them accessible throughout component
  const handleAccidentReport = (accidentData) => {
    // Send accident data to server via WebSocket
    websocketService.send({
      type: 'REPORT_ACCIDENT',
      data: accidentData
    });
    
    // Also send via HTTP for persistence
    fetch('http://localhost:8080/api/accidents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(accidentData)
    }).catch(error => {
      console.error('Error saving accident:', error);
    });
    
    // Add to local state immediately
    setRealTimeAccidents(prev => [...prev, accidentData]);
    setShowAccidentReporter(false);
  };

  const handleRouteRequest = (routeData) => {
    setSafeRoute(routeData);
    console.log('Safe route requested:', routeData);
    
    // Notify other drivers about route request
    websocketService.send({
      type: 'ROUTE_REQUEST',
      data: routeData
    });
  };

  // WebSocket connection for real-time updates
  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      console.log('Connected to real-time accident system');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log('Disconnected from real-time accident system');
    };

    const handleMessage = (data) => {
      switch (data.type) {
        case 'ACCIDENT_REPORTED':
          setRealTimeAccidents(prev => [...prev, data.accident]);
          break;
        case 'ACCIDENT_CLEARED':
          setRealTimeAccidents(prev => prev.filter(a => a.id !== data.accidentId));
          break;
        case 'ACCIDENT_UPDATE':
          setRealTimeAccidents(prev => 
            prev.map(a => a.id === data.accident.id ? data.accident : a)
          );
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    };

    websocketService.on('connected', handleConnect);
    websocketService.on('disconnected', handleDisconnect);
    websocketService.on('message', handleMessage);

    // Connect to WebSocket
    websocketService.connect();

    return () => {
      websocketService.off('connected', handleConnect);
      websocketService.off('disconnected', handleDisconnect);
      websocketService.off('message', handleMessage);
      websocketService.disconnect();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProximityAlerts();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      websocketService.disconnect();
    };
  }, []);

  // Initialize map on mount
  useEffect(() => {
    if (map.current || !mapContainer.current) return; // Prevent re-initialization

    // Create the map instance
    map.current = L.map(mapContainer.current).setView(NDOLA_CENTER, 13);

    // Add a delay to ensure the container is properly sized
    setTimeout(() => {
      map.current.invalidateSize();
    }, 100);

    // Dark theme base layer
    const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CartoDB',
      maxClusterRadius: 80,
      disableClusteringAtZoom: 16,
      chunkedLoading: true
    });
    
    darkLayer.addTo(map.current);
    
    // Initialize marker cluster group
    markerClusterGroupRef.current = new L.MarkerClusterGroup({
      maxClusterRadius: 80,
      disableClusteringAtZoom: 16,
      chunkedLoading: true
    });
    map.current.addLayer(markerClusterGroupRef.current);

    // Add roads to map
    ROADS_DATA.forEach((road) => {
      const roadColors = {
        highway: '#ff6b35',
        main: '#4a90e2',
        secondary: '#7f8c8d'
      };
      const roadWeights = {
        highway: 5,
        main: 3,
        secondary: 2
      };
      
      const polyline = L.polyline(road.coords, {
        color: roadColors[road.type] || '#64748b',
        weight: roadWeights[road.type] || 2,
        opacity: 1.0,
        interactive: true,
        smoothFactor: 1,
        lineCap: 'round',
        lineJoin: 'round'
      });

      polyline.on('click', () => {
        setSelectedRoad(road.name);
        if (onRoadClick) onRoadClick(road.name);
      });

      polyline.on('mouseover', function () {
        this.setStyle({ 
          color: '#ffd700', 
          weight: this.options.weight + 2,
          opacity: 1
        });
        
        // Show road info tooltip
        const tooltip = L.tooltip({
          permanent: false,
          direction: 'top',
          offset: [0, -10],
          className: 'road-tooltip'
        }).setContent(`<div style="background: #2c3e50; color: #ecf0f1; padding: 6px 10px; border-radius: 6px; font-size: 13px; font-weight: 600; border: 1px solid #34495e;"><strong>${road.name}</strong><br/>${road.description || 'Major road'}</div>`);
        this.bindTooltip(tooltip).openTooltip();
      });

      polyline.on('mouseout', function () {
        this.setStyle({
          color: roadColors[road.type] || '#7f8c8d',
          weight: roadWeights[road.type] || 2,
          opacity: 1.0
        });
        this.unbindTooltip();
      });

      roadsLayerRef.current[road.name] = polyline;
      polyline.addTo(map.current);
    });

    // Add towns as markers with labels
    TOWNS_DATA.forEach((town) => {
      const labelColors = {
        hub: '#f59e0b',
        high: '#8b5cf6', 
        medium: '#3b82f6',
        low: '#6b7280'
      };
      
      // Clean town markers with professional appearance
      const townIcon = L.divIcon({
        className: 'town-marker',
        html: `<div style="
          background: linear-gradient(135deg, #2c3e50, #34495e);
          color: #ecf0f1;
          padding: 8px 14px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 700;
          border: 2px solid ${labelColors[town.population] || '#95a5a6'};
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
          font-family: 'Arial', sans-serif;
        ">${town.name}</div>`,
        iconSize: [100, 35],
        iconAnchor: [50, 17]
      });
      
      L.marker(town.coords, { icon: townIcon, interactive: true })
        .addTo(map.current)
        .on('click', () => {
          setSelectedTown(town.name);
          // Highlight connected roads
          highlightConnectedRoads(town.name);
        })
        .bindPopup(`<div style="
          background: #1f2937;
          color: #f3f4f6;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #374151;
          font-size: 13px;
          min-width: 280px;
        "><strong>${town.name}</strong><br/>
        District: ${town.name}<br/>
        Population: ${town.population.toUpperCase()}<br/>
        Type: ${town.type.toUpperCase()}<br/>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #374151;">
          <strong>Connected Roads:</strong><br/>
          ${getConnectedRoads(town.name)}
        </div>
        </div>`);
    });

    // Enhanced user location tracking with accuracy and speed
    if ('geolocation' in navigator) {
      navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy, speed, heading } = position.coords;
          setUserLocation([latitude, longitude]);

          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([latitude, longitude]);
            
            // Update popup with detailed info
            const popupContent = `
              <div style="background: #1f2937; color: #f3f4f6; padding: 8px; border-radius: 6px; font-size: 12px;">
                <div style="font-weight: bold; margin-bottom: 4px;">📍 Your Location</div>
                <div>Accuracy: ±${accuracy.toFixed(0)}m</div>
                ${speed ? `<div>Speed: ${(speed * 3.6).toFixed(1)} km/h</div>` : ''}
                ${heading ? `<div>Heading: ${heading.toFixed(0)}°</div>` : ''}
                <div style="margin-top: 4px; font-size: 10px; color: #9ca3af;">
                  ${latitude.toFixed(5)}, ${longitude.toFixed(5)}
                </div>
              </div>
            `;
            userMarkerRef.current.setPopupContent(popupContent);
          } else {
            userMarkerRef.current = L.marker([latitude, longitude], {
              icon: createUserMarker()
            })
              .bindPopup(`
                <div style="background: #1f2937; color: #f3f4f6; padding: 8px; border-radius: 6px; font-size: 12px;">
                  <div style="font-weight: bold; margin-bottom: 4px;">📍 Your Location</div>
                  <div>Accuracy: ±${accuracy.toFixed(0)}m</div>
                  ${speed ? `<div>Speed: ${(speed * 3.6).toFixed(1)} km/h</div>` : ''}
                  <div style="margin-top: 4px; font-size: 10px; color: #9ca3af;">
                    ${latitude.toFixed(5)}, ${longitude.toFixed(5)}
                  </div>
                </div>
              `)
              .addTo(map.current);
          }

          // Auto-pan to user location if they move significantly
          if (map.current) {
            const currentCenter = map.current.getCenter();
            const distanceFromCenter = calculateDistance(
              currentCenter.lat, currentCenter.lng,
              latitude, longitude
            );
            
            if (distanceFromCenter > 2) { // If user is >2km from map center
              map.current.panTo([latitude, longitude], {
                animate: true,
                duration: 1
              });
            }
          }
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Show user-friendly error message
          if (error.code === 1) {
            console.log('Location access denied by user');
          } else if (error.code === 2) {
            console.log('Location unavailable');
          } else if (error.code === 3) {
            console.log('Location request timeout - retrying with lower accuracy...');
            // Retry with lower accuracy settings
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation([latitude, longitude]);
              },
              (retryError) => {
                console.log('Retry failed:', retryError);
              },
              { enableHighAccuracy: false, timeout: 15000, maximumAge: 120000 }
            );
          }
        },
        { 
          enableHighAccuracy: true, 
          timeout: 20000, // Increased timeout to 20s
          maximumAge: 60000, // Accept 60s old positions
          distanceFilter: 5 // Update only if moved 5m
        }
      );
    }

  // Highlight roads connected to selected town
  const highlightConnectedRoads = (townName) => {
    // Reset all roads to normal style
    Object.values(roadsLayerRef.current).forEach(road => {
      if (road && road.setStyle) {
        const roadColors = {
          highway: '#ff6b35',
          main: '#4a90e2',
          secondary: '#7f8c8d'
        };
        const roadWeights = {
          highway: 5,
          main: 3,
          secondary: 2
        };
        road.setStyle({
          color: roadColors[road.options.type] || '#7f8c8d',
          weight: roadWeights[road.options.type] || 2,
          opacity: 1.0
        });
      }
    });

    // Highlight roads connected to the selected town
    const connectedRoads = ROADS_DATA.filter(road => 
      road.connects && road.connects.includes(townName)
    );
    
    connectedRoads.forEach(road => {
      const roadLayer = roadsLayerRef.current[road.name];
      if (roadLayer && roadLayer.setStyle) {
        roadLayer.setStyle({
          color: '#ffd700',
          weight: (road.type === 'highway' ? 7 : road.type === 'main' ? 5 : 3),
          opacity: 1.0
        });
      }
    });
  };

  return () => {
    // Cleanup on unmount
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
  };
  }, []);

  // Update accident markers
  useEffect(() => {
    if (!map.current) return;

    accidents.forEach((accident) => {
      const { id, latitude, longitude, roadName, town, status, severity, createdAt, description, driverUsername } = accident;

      if (!accidentMarkersRef.current[id]) {
        const accidentSeverity = severity || status || 'High';
        const accidentStatus = status || 'active';
        const marker = L.marker([latitude, longitude], {
          icon: createAccidentMarker(accidentSeverity, accidentStatus)
        })
          .bindPopup(
            '<div style="background: #1f2937; color: #f3f4f6; padding: 12px; border-radius: 8px; min-width: 250px; font-family: system-ui, -apple-system, sans-serif; border: 1px solid #374151;">' +
              '<div style="display: flex; align-items: center; margin-bottom: 8px;">' +
                '<div style="background: ' + (accidentSeverity === 'Critical' ? '#dc2626' : accidentSeverity === 'High' ? '#ef4444' : accidentSeverity === 'Medium' ? '#eab308' : '#22c55e') + '; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; margin-right: 8px;">' + accidentSeverity + '</div>' +
                (accidentStatus === 'resolved' ? '<div style="background: #6b7280; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">RESOLVED</div>' : '<div style="background: #ef4444; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; animation: pulse 2s infinite;">ACTIVE</div>') + '</div>' +
              '</div>' +
              '<h4 style="margin: 0 0 8px 0; color: #fbbf24; font-size: 16px;">' + roadName + '</h4>' +
              '<p style="margin: 0 0 4px 0; font-size: 13px; color: #9ca3af;">📍 ' + town + '</p>' +
              (description ? '<p style="margin: 0 0 8px 0; font-size: 12px; line-height: 1.4;">' + description + '</p>' : '') +
              '<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #374151; font-size: 11px; color: #6b7280;">' +
                '<div>📅 ' + new Date(createdAt).toLocaleString() + '</div>' +
                (driverUsername ? '<div>👤 Reported by ' + driverUsername + '</div>' : '') +
                '<div>📍 ' + latitude.toFixed(5) + ', ' + longitude.toFixed(5) + '</div>' +
              '</div>' +
            '</div>'
          )
          .addTo(map.current);

        accidentMarkersRef.current[id] = marker;
      }
    });
  }, [accidents]);

  // Draw alternative route and user route
  useEffect(() => {
    if (!map.current || !userLocation) return;

    // Remove previous route layers
    if (routeLayerRef.current) {
      map.current.removeLayer(routeLayerRef.current);
    }

    // Draw user's current route to destination (if any)
    if (selectedRoad) {
      const road = ROADS_DATA.find((r) => r.name === selectedRoad);
      if (road) {
        // Calculate alternative route (bypass accidents on selected road)
        const alternativeCoords = calculateAlternativeRoute(road.coords, road.name);

        // Draw route on map
        routeLayerRef.current = L.polyline(alternativeCoords, {
          color: '#10b981',
          weight: 5,
          opacity: 0.9,
          dashArray: '10, 5',
          className: 'alternative-route'
        }).addTo(map.current);
        
        // Add route label with distance info
        const routeDistance = calculateRouteDistance(alternativeCoords);
        const routeCenter = alternativeCoords[Math.floor(alternativeCoords.length / 2)];
        L.marker(routeCenter, {
          icon: L.divIcon({
            html: `<div style="
              background: #10b981;
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: bold;
              white-space: nowrap;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">🚗 Alternative Route (${routeDistance.toFixed(1)}km)</div>`,
            className: 'route-label',
            iconSize: [140, 20],
            iconAnchor: [70, 10]
          })
        }).addTo(map.current);

        setAlternativeRoute(alternativeCoords);
      }
    } else {
      // Show route from user location to city center when no road selected
      const cityCenterRoute = [
        userLocation,
        [(userLocation[0] + NDOLA_CENTER[0]) / 2, (userLocation[1] + NDOLA_CENTER[1]) / 2],
        NDOLA_CENTER
      ];

      routeLayerRef.current = L.polyline(cityCenterRoute, {
        color: '#3b82f6',
        weight: 3,
        opacity: 0.7,
        dashArray: '5, 5'
      }).addTo(map.current);
    }
  }, [selectedRoad, userLocation, accidents]);

  // Get roads connected to a specific town
  const getConnectedRoads = (townName) => {
    const connectedRoads = ROADS_DATA.filter(road => 
      road.connects && road.connects.includes(townName)
    );
    return connectedRoads.map(road => 
      `<span style="color: #3b82f6; font-weight: 600;">${road.name}</span>`
    ).join(' • ');
  };

  // Calculate route distance
  const calculateRouteDistance = (coords) => {
    let totalDistance = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      totalDistance += calculateDistance(
        coords[i][0], coords[i][1],
        coords[i + 1][0], coords[i + 1][1]
      );
    }
    return totalDistance;
  };

  // Calculate alternative route avoiding accidents using actual Ndola roads
  const calculateAlternativeRoute = (mainRoadCoords, roadName) => {
    if (mainRoadCoords.length < 2) return mainRoadCoords;

    const start = mainRoadCoords[0];
    const end = mainRoadCoords[mainRoadCoords.length - 1];

    // Check for active accidents on or near the main road
    const activeAccidents = accidents.filter(acc => 
      acc.status !== 'resolved' && isAccidentNearRoad(acc, mainRoadCoords)
    );

    if (activeAccidents.length === 0) {
      // No accidents on this road, return original route
      return mainRoadCoords;
    }

    // Find alternative roads that connect the same towns
    const currentRoad = ROADS_DATA.find(r => r.name === roadName);
    if (!currentRoad || !currentRoad.connects) return mainRoadCoords;

    // Find alternative routes connecting the same towns
    const alternativeRoutes = ROADS_DATA.filter(road => {
      if (road.name === roadName) return false;
      return road.connects && 
             road.connects.some(town => currentRoad.connects.includes(town));
    });

    if (alternativeRoutes.length > 0) {
      // Use the first available alternative road
      const altRoute = alternativeRoutes[0];
      
      // Create a route that connects via town centers
      const routeCoords = [];
      
      // Add connection from start to first connected town
      if (altRoute.connects.includes(currentRoad.connects[0])) {
        const town = TOWNS_DATA.find(t => t.name === currentRoad.connects[0]);
        if (town) {
          routeCoords.push(start, town.coords);
        }
      }
      
      // Add the alternative road coordinates
      routeCoords.push(...altRoute.coords);
      
      // Add connection to end
      if (altRoute.connects.includes(currentRoad.connects[1])) {
        const town = TOWNS_DATA.find(t => t.name === currentRoad.connects[1]);
        if (town) {
          routeCoords.push(town.coords, end);
        }
      }
      
      return routeCoords.length > 2 ? routeCoords : mainRoadCoords;
    }

    // Fallback: create a simple detour around the accident
    const accidentLat = activeAccidents[0].latitude;
    const accidentLon = activeAccidents[0].longitude;
    
    // Calculate detour direction based on accident location
    const detourOffset = 0.010; // ~1km detour
    const detourDirection = accidentLon > (start[1] + end[1]) / 2 ? -1 : 1;
    
    // Find nearest town for detour reference
    const nearestTown = TOWNS_DATA.reduce((nearest, town) => {
      const distance = calculateDistance(
        accidentLat, accidentLon,
        town.coords[0], town.coords[1]
      );
      const nearestDistance = nearest ? calculateDistance(
        accidentLat, accidentLon,
        nearest.coords[0], nearest.coords[1]
      ) : Infinity;
      return distance < nearestDistance ? town : nearest;
    }, null);
    
    // Create route that bypasses accident via nearest town
    if (nearestTown) {
      return [
        start,
        nearestTown.coords,
        end
      ];
    }

    // Final fallback - simple detour
    return [
      start,
      [accidentLat - detourOffset, accidentLon + (detourOffset * detourDirection)],
      end
    ];
  };

  // Check if accident is near a road (within ~500m)
  const isAccidentNearRoad = (accident, roadCoords) => {
    const threshold = 0.005; // ~500m in degrees
    return roadCoords.some(coord => 
      Math.abs(coord[0] - accident.latitude) < threshold &&
      Math.abs(coord[1] - accident.longitude) < threshold
    );
  };

  // Check for nearby accidents and trigger alerts
  useEffect(() => {
    if (!userLocation || !onNearbyAccident) return;

    const nearbyAccidents = accidents.filter(accident => {
      if (accident.status === 'resolved') return false;
      
      const distance = calculateDistance(
        userLocation[0], userLocation[1],
        accident.latitude, accident.longitude
      );
      
      return distance < 0.5; // Within 500m
    });

    if (nearbyAccidents.length > 0) {
      onNearbyAccident(nearbyAccidents);
    }
  }, [userLocation, accidents, onNearbyAccident]);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <div ref={mapContainer} style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }} />
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .leaflet-container {
          background: #0f172a;
          border-radius: 12px;
          border: 2px solid #1e293b;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .leaflet-control-attribution {
          background: rgba(15, 23, 42, 0.9);
          color: #9ca3af;
          font-size: 11px;
        }
        .leaflet-control-zoom {
          background: linear-gradient(135deg, #1f2937, #374151);
          border: 2px solid #4b5563;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .leaflet-control-zoom a {
          background: transparent;
          color: #f3f4f6;
          border: 1px solid #64748b;
          border-radius: 6px;
          margin: 2px;
          transition: all 0.2s ease;
        }
        .leaflet-control-zoom a:hover {
          background: #3b82f6;
          color: white;
          transform: scale(1.1);
        }
        .alternative-route {
          animation: dashMove 20s linear infinite;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        @keyframes dashMove {
          to { stroke-dashoffset: -30; }
        }
        @keyframes buzz {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-10deg) scale(1.1); }
          50% { transform: rotate(0deg) scale(1); }
          75% { transform: rotate(10deg) scale(1.1); }
        }
        @keyframes alertPulse {
          0%, 100% { 
            transform: translateX(-50%) scale(1);
            opacity: 1;
          }
          50% { 
            transform: translateX(-50%) scale(1.02);
            opacity: 0.9;
          }
        }
        .road-tooltip .leaflet-tooltip-content {
          background: linear-gradient(135deg, #1f2937, #374151);
          color: #f3f4f6;
          border: 2px solid #4b5563;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 12px;
          box-shadow: 0 6px 12px rgba(0,0,0,0.4);
        }
        .leaflet-popup-tip {
          background: #1f2937;
        }
        .leaflet-popup-content-wrapper {
          background: linear-gradient(135deg, #1f2937, #374151);
          color: #f3f4f6;
          border-radius: 12px;
          border: 2px solid #4b5563;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        .leaflet-popup-content {
          margin: 0;
          padding: 0;
        }
        .town-marker {
          transition: all 0.3s ease;
        }
        .town-marker:hover {
          transform: scale(1.1);
          z-index: 1000;
        }
        .accident-marker {
          animation: pulse 2s infinite;
        }
        .route-label {
          background: linear-gradient(135deg, #10b981, #059669);
          border: 2px solid #047857;
          border-radius: 8px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
      `}
      </style>
      
      {/* Map Legend */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(31, 41, 55, 0.95)',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #374151',
        zIndex: 1000,
        fontSize: '11px',
        color: '#f3f4f6',
        backdropFilter: 'blur(4px)'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#fbbf24' }}>Map Legend</div>
        <div style={{ marginBottom: '4px' }}>🔴 Critical/High Accident</div>
        <div style={{ marginBottom: '4px' }}>🟡 Medium Accident</div>
        <div style={{ marginBottom: '4px' }}>🟢 Low Accident</div>
        <div style={{ marginBottom: '4px' }}>🟦 Alternative Route</div>
        <div style={{ marginBottom: '4px' }}>🔴 T3/M6 Highways</div>
        <div style={{ marginBottom: '4px' }}>🔵 Main Roads</div>
        <div style={{ marginBottom: '4px' }}>⚪ Secondary Roads</div>
        <div style={{ marginBottom: '4px' }}>🟡 Your Location</div>
      </div>
      
      {/* Proximity Alert Indicator */}
      {isNearHotspot && proximityAlert && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(239, 68, 68, 0.95)',
          padding: '12px 20px',
          borderRadius: '8px',
          border: '2px solid #dc2626',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '14px',
          zIndex: 1001,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <div style={{ marginBottom: '4px' }}>ACCIDENT HOTSPOT NEARBY!</div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>
            {proximityAlert.distance.toFixed(0)}m away • Buzz alerts active
          </div>
        </div>
      )}
      
      {/* Real-time Accident Reporter */}
      {showAccidentReporter && (
        <AccidentReporter
          onAccidentReport={handleAccidentReport}
          userLocation={userLocation}
        />
      )}
      
      {/* Real-time Accidents Display */}
      <RealTimeAccidents
        accidents={realTimeAccidents}
        userLocation={userLocation}
        onRouteRequest={handleRouteRequest}
        map={map.current}
      />
      
      {/* Connection Status */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: isConnected ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
        padding: '8px 16px',
        borderRadius: '20px',
        zIndex: 1002,
        fontSize: '12px',
        fontWeight: '600',
        color: 'white',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: isConnected ? '#10b981' : '#ef4444',
          animation: isConnected ? 'pulse 2s infinite' : 'none'
        }}></span>
        {isConnected ? '🟢 Real-time Connected' : '🔴 Disconnected'}
      </div>
      
      {/* Accident Report Toggle */}
      <div style={{
        position: 'absolute',
        bottom: '80px',
        right: '10px',
        zIndex: 1000
      }}>
        <button
          onClick={() => setShowAccidentReporter(!showAccidentReporter)}
          style={{
            background: showAccidentReporter ? '#ef4444' : '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '25px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'all 0.3s ease',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {showAccidentReporter ? '✕ Cancel' : '📸 Report Accident'}
        </button>
      </div>
      
      {/* User Location Status */}
      {userLocation && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          background: isNearHotspot ? 'rgba(239, 68, 68, 0.95)' : 'rgba(31, 41, 55, 0.95)',
          padding: '8px 12px',
          borderRadius: '6px',
          border: isNearHotspot ? '2px solid #dc2626' : '1px solid #374151',
          zIndex: 1000,
          fontSize: '11px',
          color: '#10b981',
          backdropFilter: 'blur(4px)'
        }}>
          📍 GPS Tracking Active
        </div>
      )}
    </div>
  );
};
