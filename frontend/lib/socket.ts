import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export const connectToBoard = (boardId: string, token: string): Socket => {
  // Disconnect existing socket if any
  if (socket) {
    socket.disconnect();
  }

  // Create new socket connection
  socket = io(`${BACKEND_URL}/board`, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
  });

  // Join the board room
  socket.on('connect', () => {
    console.log('[Socket] Connected to board gateway');
    socket?.emit('joinBoard', boardId);
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Disconnected from board gateway');
  });

  socket.on('error', (error) => {
    console.error('[Socket] Error:', error);
  });

  return socket;
};

export const disconnectFromBoard = (boardId: string) => {
  if (socket) {
    socket.emit('leaveBoard', boardId);
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};
