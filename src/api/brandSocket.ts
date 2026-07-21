import { io, Socket } from 'socket.io-client';
import { getStoredToken } from './axios';

let socket: Socket | null = null;

function getSocketUrl() {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5057';
  return String(base).replace(/\/$/, '');
}

export function getBrandSocket(): Socket {
  if (socket?.connected) return socket;

  if (!socket) {
    socket = io(getSocketUrl(), {
      autoConnect: false,
      withCredentials: true,
      transports: ['websocket', 'polling'],
      auth: {
        token: getStoredToken() || undefined,
      },
    });
  }

  if (!socket.connected) {
    socket.auth = { token: getStoredToken() || undefined };
    socket.connect();
  }

  return socket;
}

export function joinBrandConfigureRoom(configureId: string) {
  const s = getBrandSocket();
  s.emit('brand:join', configureId);
}

export function leaveBrandConfigureRoom(configureId: string) {
  if (!socket) return;
  socket.emit('brand:leave', configureId);
}

export function disconnectBrandSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}
