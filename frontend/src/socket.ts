import { io } from 'socket.io-client';

export const createSocketConnection = () => {
  const SOCKET_URL = `http://localhost:3000`;

  const socket = io(SOCKET_URL, {
    withCredentials: true,
    auth: {
      token: localStorage.getItem('authToken'),
    },
    forceNew: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 2,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Socket connected successfully');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  return socket;
};
