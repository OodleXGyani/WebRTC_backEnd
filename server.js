import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Store connected users: userId -> WebSocket
const users = new Map();

wss.on('connection', (ws) => {
  let userId = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'register':
          userId = message.userId;
          users.set(userId, ws);
          console.log(`[${userId}] registered`);
          break;

        case 'call':
        case 'offer':
        case 'answer':
        case 'ice':
        case 'end':
          // Route to target user
          const targetSocket = users.get(message.to);
          if (targetSocket && targetSocket.readyState === 1) {
            targetSocket.send(JSON.stringify(message));
          } else {
            console.warn(`[Signaling] User ${message.to} not found`);
          }
          break;

        default:
          console.warn(`[Signaling] Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('[Signaling] Error processing message:', error);
    }
  });

  ws.on('close', () => {
    if (userId) {
      users.delete(userId);
      console.log(`[${userId}] disconnected`);
    }
  });

  ws.on('error', (error) => {
    console.error('[Signaling] WebSocket error:', error);
  });
});

server.listen(8080, '0.0.0.0', () => {
  console.log('Signaling server listening on ws://0.0.0.0:8080');
});