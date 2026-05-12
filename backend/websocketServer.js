const WebSocket = require('ws');
const mongoose = require('mongoose');
const Accident = require('./models/Accident');
const http = require('http');
const { Server } = require('ws');

class WebSocketServer {
  constructor() {
    this.wss = null;
    this.clients = new Map();
    this.port = 8081;
    this.httpServer = null;
  }

  start() {
    // Create HTTP server for SockJS fallback
    this.httpServer = http.createServer();
    
    // Create WebSocket server
    this.wss = new Server({ 
      server: this.httpServer,
      path: '/ws'
    });

    // Start HTTP server
    this.httpServer.listen(this.port, () => {
      console.log(`WebSocket server running on port ${this.port}`);
    });

    this.wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection established');
      
      // Generate unique client ID
      const clientId = this.generateClientId();
      this.clients.set(clientId, {
        ws,
        id: clientId,
        connected: new Date(),
        lastActivity: new Date()
      });

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'CONNECTED',
        data: {
          clientId,
          message: 'Connected to RTSA Real-time Accident System'
        }
      });

      // Handle messages from client
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(clientId, data);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      // Handle client disconnection
      ws.on('close', () => {
        console.log(`Client ${clientId} disconnected`);
        this.clients.delete(clientId);
        this.broadcastClientCount();
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
      });

      // Send current accident data to new client
      this.sendCurrentAccidents(clientId);
      this.broadcastClientCount();
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });
  }

  generateClientId() {
    return 'client_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  async handleMessage(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.lastActivity = new Date();

    switch (data.type) {
      case 'REPORT_ACCIDENT':
        await this.handleAccidentReport(clientId, data.data);
        break;
      
      case 'ROUTE_REQUEST':
        this.handleRouteRequest(clientId, data.data);
        break;
      
      case 'PING':
        this.sendToClient(clientId, { type: 'PONG' });
        break;
      
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  async handleAccidentReport(clientId, accidentData) {
    try {
      const validatedData = this.validateAccidentData(accidentData);
      if (!validatedData) {
        this.sendToClient(clientId, {
          type: 'ERROR',
          data: { message: 'Invalid accident data' }
        });
        return;
      }

      const accident = await Accident.create({
        roadName: validatedData.roadName,
        town: validatedData.town || 'Ndola',
        description: validatedData.description || '',
        severity: validatedData.severity || 'Medium',
        status: 'pending',
        verified: false,
        verificationStatus: 'pending',
        coordinates: validatedData.coordinates,
        photo: validatedData.photo ? String(validatedData.photo).slice(0, 240) : '',
        reportedBy: validatedData.reportedBy || 'driver',
        driverUsername: validatedData.driverUsername || 'driver'
      });

      const json = accident.toJSON();

      this.broadcast({
        type: 'ACCIDENT_REPORTED',
        accident: json
      });

      console.log(`Accident reported by client ${clientId}:`, json.id);

      this.scheduleAccidentRemoval(accident._id.toString(), accident.clearanceTime);
    } catch (error) {
      console.error('Error handling accident report:', error);
      this.sendToClient(clientId, {
        type: 'ERROR',
        data: { message: 'Failed to save accident report' }
      });
    }
  }

  handleRouteRequest(clientId, routeData) {
    // Broadcast route request to other drivers in the area
    this.broadcast({
      type: 'ROUTE_REQUEST',
      data: routeData,
      requesterId: clientId
    }, clientId); // Exclude requester from broadcast

    console.log(`Route request from client ${clientId}:`, routeData);
  }

  validateAccidentData(data) {
    const required = ['roadName', 'coordinates', 'severity'];
    for (const field of required) {
      if (!data[field]) {
        console.error(`Missing required field: ${field}`);
        return null;
      }
    }
    const coords = data.coordinates;
    if (
      coords.latitude == null ||
      coords.longitude == null ||
      Number.isNaN(Number(coords.latitude)) ||
      Number.isNaN(Number(coords.longitude))
    ) {
      return null;
    }

    return {
      ...data,
      coordinates: {
        latitude: Number(coords.latitude),
        longitude: Number(coords.longitude)
      },
      town: data.town || 'Ndola',
      photo: data.photo || 'websocket-report'
    };
  }

  scheduleAccidentRemoval(accidentId, clearanceTime) {
    const clearanceDate = new Date(clearanceTime);
    const now = new Date();
    const timeUntilClearance = clearanceDate - now;

    if (timeUntilClearance > 0) {
      setTimeout(() => {
        this.removeAccident(accidentId);
      }, timeUntilClearance);
    }
  }

  async removeAccident(accidentId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(accidentId)) {
        return;
      }
      await Accident.findByIdAndUpdate(accidentId, {
        status: 'cleared',
        clearedAt: new Date()
      });

      this.broadcast({
        type: 'ACCIDENT_CLEARED',
        accidentId: String(accidentId)
      });

      console.log(`Accident ${accidentId} automatically cleared after scheduled clearance`);
    } catch (error) {
      console.error('Error removing accident:', error);
    }
  }

  async sendCurrentAccidents(clientId) {
    try {
      const activeAccidents = await Accident.find({
        status: { $in: ['active', 'pending'] },
        clearanceTime: { $gt: new Date() }
      });

      this.sendToClient(clientId, {
        type: 'CURRENT_ACCIDENTS',
        data: activeAccidents.map((a) => a.toJSON())
      });

    } catch (error) {
      console.error('Error sending current accidents:', error);
    }
  }

  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  broadcast(message, excludeClientId = null) {
    const messageStr = JSON.stringify(message);
    
    this.clients.forEach((client, clientId) => {
      if (clientId !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    });
  }

  broadcastClientCount() {
    const activeClients = Array.from(this.clients.values()).filter(
      client => client.ws.readyState === WebSocket.OPEN
    ).length;

    this.broadcast({
      type: 'CLIENT_COUNT',
      count: activeClients
    });
  }

  // Cleanup inactive connections
  startCleanupInterval() {
    setInterval(() => {
      const now = new Date();
      const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

      this.clients.forEach((client, clientId) => {
        if (now - client.lastActivity > inactiveThreshold) {
          console.log(`Removing inactive client: ${clientId}`);
          client.ws.terminate();
          this.clients.delete(clientId);
        }
      });

      this.broadcastClientCount();
    }, 60000); // Check every minute
  }
}

module.exports = WebSocketServer;
