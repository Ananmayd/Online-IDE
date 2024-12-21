import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import playgroundRoutes from './routes/playgroundRoutes';
import * as pty from 'node-pty';
import * as path from 'path';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

dotenv.config();

const app = express();
const httpServer = createServer(app);  // Create HTTP server with Express app

// Configure CORS for both Express and Socket.IO
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173', // Adjust this to your client URL
  methods: ['GET', 'POST'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Initialize Socket.IO with the HTTP server
const io = new SocketServer(httpServer, {
  cors: corsOptions
});

// Terminal setup
const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
const ptyProcess = pty.spawn(shell, [], {
  name: 'xterm-color',
  cols: 80,
  rows: 30,
  cwd: process.env.INIT_CWD,
  env: process.env
});

// Socket.IO event handlers
ptyProcess.onData((data) => {
  io.emit("terminal:data", data);
});

io.on('connection', (socket) => {
  console.log(`Socket Connected: ${socket.id}`);
  
  socket.on('terminal:write', (data) => {
    ptyProcess.write(data);
  });

  socket.on('disconnect', () => {
    console.log(`Socket Disconnected: ${socket.id}`);
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/playground', playgroundRoutes);

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {  // Use httpServer instead of app.listen
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server ready`);
});