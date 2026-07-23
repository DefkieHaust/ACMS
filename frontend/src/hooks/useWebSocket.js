import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const WS_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:${window.location.port || 5000}/ws`;

export default function useWebSocket(onNotification) {
  const { user, isAuthenticated } = useAuth();
  const wsRef = useRef(null);
  const onNotifRef = useRef(onNotification);
  onNotifRef.current = onNotification;

  const connect = useCallback(() => {
    if (!isAuthenticated || !user?.id) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', userId: user.id }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'notification' && onNotifRef.current) {
          onNotifRef.current(msg.data);
        }
      } catch {
        // ignore
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
    };

    ws.onerror = () => {
      wsRef.current = null;
    };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);
}
