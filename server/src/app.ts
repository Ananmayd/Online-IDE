import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import playgroundRoutes from './routes/playgroundRoutes';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import SocketService from './services/socketServices';

dotenv.config();

const app = express();

const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/playground', playgroundRoutes);

const httpServer = http.createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  pingTimeout: 60000,
  maxHttpBufferSize: 1e6,
});

export const socketObj = new SocketService(io);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

