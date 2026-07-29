import { io, Socket } from 'socket.io-client';
import { getStoredToken } from './axios';

let socket: Socket | null = null;
const joinedBrandRooms = new Set<string>();

function getSocketUrl() {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5057';
  return String(base).replace(/\/$/, '');
}

function rejoinBrandRooms(s: Socket) {
  joinedBrandRooms.forEach((configureId) => {
    s.emit('brand:join', configureId);
  });
}

/** Shared authenticated Socket.IO client (brand + device events). */
export function getAppSocket(): Socket {
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

    socket.on('connect', () => {
      rejoinBrandRooms(socket!);
    });
  }

  if (!socket.connected) {
    socket.auth = { token: getStoredToken() || undefined };
    socket.connect();
  }

  return socket;
}

export function getBrandSocket(): Socket {
  return getAppSocket();
}

export function joinBrandConfigureRoom(configureId: string) {
  const id = String(configureId || '').trim();
  if (!id) return;

  joinedBrandRooms.add(id);
  const s = getBrandSocket();
  if (s.connected) {
    s.emit('brand:join', id);
  }
  // If not connected yet, `connect` handler will rejoin all rooms.
}

export function leaveBrandConfigureRoom(configureId: string) {
  const id = String(configureId || '').trim();
  if (!id) return;

  joinedBrandRooms.delete(id);
  if (!socket) return;
  if (socket.connected) {
    socket.emit('brand:leave', id);
  }
}

export function disconnectBrandSocket() {
  if (!socket) return;
  joinedBrandRooms.clear();
  socket.disconnect();
  socket = null;
}
