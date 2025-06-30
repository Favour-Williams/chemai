import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

interface WebSocketClient {
  id: string;
  ws: WebSocket;
  userId?: string;
  rooms: Set<string>;
  lastActivity: Date;
}

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
  messageId: string;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, WebSocketClient>();
  private rooms = new Map<string, Set<string>>(); // roomId -> Set of clientIds
  private heartbeatInterval: NodeJS.Timeout | null = null;

  initialize(server: any): void {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.startHeartbeat();
    
    console.log('WebSocket server initialized');
  }

  private verifyClient(info: { origin: string; secure: boolean; req: IncomingMessage }): boolean {
    // Add origin verification if needed
    return true;
  }

  private handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const clientId = uuidv4();
    const client: WebSocketClient = {
      id: clientId,
      ws,
      rooms: new Set(),
      lastActivity: new Date()
    };

    // Try to authenticate user from query params or headers
    this.authenticateClient(client, req);

    this.clients.set(clientId, client);
    console.log(`Client ${clientId} connected. Total clients: ${this.clients.size}`);

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'connection',
      data: { clientId, message: 'Connected to ChemAI WebSocket server' }
    });

    // Handle messages
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(clientId, message);
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
        this.sendError(clientId, 'Invalid message format');
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      this.handleDisconnection(clientId);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      this.handleDisconnection(clientId);
    });

    // Update last activity on pong
    ws.on('pong', () => {
      const client = this.clients.get(clientId);
      if (client) {
        client.lastActivity = new Date();
      }
    });
  }

  private authenticateClient(client: WebSocketClient, req: IncomingMessage): void {
    try {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      
      if (token) {
        const decoded = jwt.verify(token, process.env['JWT_SECRET']!) as any;
        client.userId = decoded.userId;
        console.log(`Client ${client.id} authenticated as user ${client.userId}`);
      }
    } catch (error) {
      console.log(`Client ${client.id} not authenticated`);
    }
  }

  private handleMessage(clientId: string, message: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.lastActivity = new Date();

    switch (message.type) {
      case 'join_room':
        this.joinRoom(clientId, message.data.roomId);
        break;
      
      case 'leave_room':
        this.leaveRoom(clientId, message.data.roomId);
        break;
      
      case 'chat_message':
        this.handleChatMessage(clientId, message.data);
        break;
      
      case 'reaction_update':
        this.handleReactionUpdate(clientId, message.data);
        break;
      
      case 'collaboration_event':
        this.handleCollaborationEvent(clientId, message.data);
        break;
      
      case 'ping':
        this.sendToClient(clientId, { type: 'pong', data: { timestamp: new Date().toISOString() } });
        break;
      
      default:
        this.sendError(clientId, `Unknown message type: ${message.type}`);
    }
  }

  private handleDisconnection(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from all rooms
    client.rooms.forEach(roomId => {
      this.leaveRoom(clientId, roomId);
    });

    // Remove client
    this.clients.delete(clientId);
    console.log(`Client ${clientId} disconnected. Total clients: ${this.clients.size}`);
  }

  private joinRoom(clientId: string, roomId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.rooms.add(roomId);
    
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(clientId);

    this.sendToClient(clientId, {
      type: 'room_joined',
      data: { roomId, message: `Joined room ${roomId}` }
    });

    // Notify other room members
    this.broadcastToRoom(roomId, {
      type: 'user_joined',
      data: { userId: client.userId, roomId }
    }, clientId);

    console.log(`Client ${clientId} joined room ${roomId}`);
  }

  private leaveRoom(clientId: string, roomId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.rooms.delete(roomId);
    
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(clientId);
      if (room.size === 0) {
        this.rooms.delete(roomId);
      }
    }

    this.sendToClient(clientId, {
      type: 'room_left',
      data: { roomId, message: `Left room ${roomId}` }
    });

    // Notify other room members
    this.broadcastToRoom(roomId, {
      type: 'user_left',
      data: { userId: client.userId, roomId }
    }, clientId);

    console.log(`Client ${clientId} left room ${roomId}`);
  }

  private handleChatMessage(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { roomId, message } = data;
    
    if (!client.rooms.has(roomId)) {
      this.sendError(clientId, 'Not in specified room');
      return;
    }

    const chatMessage = {
      type: 'chat_message',
      data: {
        messageId: uuidv4(),
        userId: client.userId,
        roomId,
        message,
        timestamp: new Date().toISOString()
      }
    };

    this.broadcastToRoom(roomId, chatMessage);
  }

  private handleReactionUpdate(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { roomId, reactionData } = data;
    
    if (!client.rooms.has(roomId)) {
      this.sendError(clientId, 'Not in specified room');
      return;
    }

    const updateMessage = {
      type: 'reaction_update',
      data: {
        userId: client.userId,
        roomId,
        reactionData,
        timestamp: new Date().toISOString()
      }
    };

    this.broadcastToRoom(roomId, updateMessage, clientId);
  }

  private handleCollaborationEvent(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { roomId, eventType, eventData } = data;
    
    if (!client.rooms.has(roomId)) {
      this.sendError(clientId, 'Not in specified room');
      return;
    }

    const collaborationMessage = {
      type: 'collaboration_event',
      data: {
        userId: client.userId,
        roomId,
        eventType,
        eventData,
        timestamp: new Date().toISOString()
      }
    };

    this.broadcastToRoom(roomId, collaborationMessage, clientId);
  }

  private sendToClient(clientId: string, message: Partial<WebSocketMessage>): void {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) return;

    const fullMessage: WebSocketMessage = {
      type: message.type || 'message',
      data: message.data || {},
      timestamp: new Date().toISOString(),
      messageId: uuidv4()
    };

    try {
      client.ws.send(JSON.stringify(fullMessage));
    } catch (error) {
      console.error(`Error sending message to client ${clientId}:`, error);
      this.handleDisconnection(clientId);
    }
  }

  private broadcastToRoom(roomId: string, message: Partial<WebSocketMessage>, excludeClientId?: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.forEach(clientId => {
      if (clientId !== excludeClientId) {
        this.sendToClient(clientId, message);
      }
    });
  }

  private sendError(clientId: string, error: string): void {
    this.sendToClient(clientId, {
      type: 'error',
      data: { error, timestamp: new Date().toISOString() }
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      const timeout = 30000; // 30 seconds

      this.clients.forEach((client, clientId) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          // Check if client is still responsive
          if (now.getTime() - client.lastActivity.getTime() > timeout) {
            console.log(`Client ${clientId} timed out`);
            client.ws.terminate();
            this.handleDisconnection(clientId);
          } else {
            // Send ping
            client.ws.ping();
          }
        } else {
          this.handleDisconnection(clientId);
        }
      });
    }, 15000); // Check every 15 seconds
  }

  // Public methods for external use
  public broadcastToAllClients(message: Partial<WebSocketMessage>): void {
    this.clients.forEach((client, clientId) => {
      this.sendToClient(clientId, message);
    });
  }

  public sendToUser(userId: string, message: Partial<WebSocketMessage>): void {
    this.clients.forEach((client, clientId) => {
      if (client.userId === userId) {
        this.sendToClient(clientId, message);
      }
    });
  }

  public getStats(): { totalClients: number; totalRooms: number; authenticatedClients: number } {
    const authenticatedClients = Array.from(this.clients.values()).filter(c => c.userId).length;
    
    return {
      totalClients: this.clients.size,
      totalRooms: this.rooms.size,
      authenticatedClients
    };
  }

  public shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.clients.forEach((client) => {
      client.ws.close();
    });

    if (this.wss) {
      this.wss.close();
    }

    console.log('WebSocket service shut down');
  }
}

export const websocketService = new WebSocketService();