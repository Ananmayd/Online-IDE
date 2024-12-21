import { Server as SocketServer, Socket } from 'socket.io';
import Docker from 'dockerode';
import { startPlaygroundContainer, stopPlaygroundContainer } from './dockerServices';

class SocketService {
  private io: SocketServer;
  private activeSessions: Map<string, { containerId: string; stream: any }>;
  private docker: Docker;

  constructor(io: SocketServer) {
    this.io = io;
    this.activeSessions = new Map();
    this.docker = new Docker();
    this.initialize();
  }

  private initialize(): void {
    this.io.on('connection', this.handleConnection.bind(this));
  }

  private async handleConnection(socket: Socket): Promise<void> {
    console.log('Client connected:', socket.id);

    socket.on('start-terminal', async (data) => {
      await this.handleStartTerminal(socket, data);
    });

    socket.on('terminal:write', (data) => {
      this.handleTerminalWrite(socket, data);
    });

    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  private async handleStartTerminal(
    socket: Socket, 
    { userId, playgroundId, language }: { 
      userId: string; 
      playgroundId: string; 
      language: string;
    }
  ): Promise<void> {
    try {
      const containerId = await startPlaygroundContainer(
        userId,
        playgroundId,
        language
      );
      
      const container = this.docker.getContainer(containerId);

      const exec = await container.exec({
        Cmd: [language === "PYTHON" ? "/bin/bash" : 
              language === "NODEJS" ? "/bin/bash" : "/bin/bash"],
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true,
        WorkingDir: "/workspace"
      });

      const stream = await exec.start({
        hijack: true,
        stdin: true
      });

      this.activeSessions.set(socket.id, {
        containerId,
        stream
      });

      // Handle terminal output
      stream.on('data', (data: Buffer) => {
        socket.emit('terminal:data', data.toString());
      });

      stream.on('error', (error: Error) => {
        console.error('Stream error:', error);
        socket.emit('terminal:error', 'Terminal error occurred');
      });

      socket.emit('terminal:ready', containerId);

    } catch (error) {
      console.error('Failed to start terminal:', error);
      socket.emit('terminal:error', 'Failed to start terminal');
    }
  }

  private handleTerminalWrite(socket: Socket, data: string): void {
    const session = this.activeSessions.get(socket.id);
    if (session && session.stream.writable) {
      session.stream.write(data);
    }
  }

  private async handleDisconnect(socket: Socket): Promise<void> {
    const session = this.activeSessions.get(socket.id);
    if (session) {
      try {
        await stopPlaygroundContainer(session.containerId);
        this.activeSessions.delete(socket.id);
        console.log(`Cleaned up session for socket ${socket.id}`);
      } catch (error) {
        console.error('Error cleaning up session:', error);
      }
    }
  }
}

export default SocketService;