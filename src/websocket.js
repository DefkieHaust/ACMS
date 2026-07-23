import { WebSocketServer } from 'ws';

const clients = new Map();

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    let userId = null;

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        if (msg.type === 'auth' && msg.userId) {
          userId = String(msg.userId);
          clients.set(userId, ws);
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.on('close', () => {
      if (userId) clients.delete(userId);
    });

    ws.on('error', () => {
      if (userId) clients.delete(userId);
    });
  });

  console.log('[WS] WebSocket server ready at /ws');
}

export function notifyUser(userId, payload) {
  const ws = clients.get(String(userId));
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify(payload));
  }
}


