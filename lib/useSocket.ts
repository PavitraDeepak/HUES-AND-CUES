import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Singleton socket instance to prevent multiple connections
let globalSocket: Socket | null = null;

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization in Strict Mode
    if (initialized.current) return;
    initialized.current = true;

    // Reuse existing socket or create new one
    if (!globalSocket || !globalSocket.connected) {
      if (globalSocket) {
        globalSocket.removeAllListeners();
        globalSocket.disconnect();
      }

      globalSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
        path: '/socket.io/',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      globalSocket.on('connect', () => {
        console.log('✅ Connected to server:', globalSocket!.id);
        setIsConnected(true);
      });

      globalSocket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from server:', reason);
        setIsConnected(false);
      });

      globalSocket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error.message);
      });
    }

    setSocket(globalSocket);
    setIsConnected(globalSocket.connected);

    // Cleanup function - but don't disconnect the socket
    return () => {
      // Don't disconnect on unmount in development mode
      // The socket will be reused on remount
    };
  }, []);

  return { socket, isConnected };
}
