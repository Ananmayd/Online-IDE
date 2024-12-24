import { Server as SocketServer, Socket } from "socket.io";
import * as pty from "node-pty";

interface PTYSession {
  containerId: string;
  ptyProcess: pty.IPty;
  lastAccessed: number;
}

class SocketService {
  private io: SocketServer;
  private activeSessions: Map<string, PTYSession>;
  private readonly SESSION_TIMEOUT = 3600000; // 1 hour

  constructor(io: SocketServer) {
    this.io = io;
    this.activeSessions = new Map();
    this.initialize();
  }

  private initialize(): void {
    this.io.on("connection", this.handleConnection.bind(this));
    this.setupCleanupInterval();
  }

  private setupCleanupInterval(): void {
    setInterval(() => this.cleanupInactiveSessions(), 300000);
  }

  private async cleanupInactiveSessions(): Promise<void> {
    for (const [socketId, session] of this.activeSessions) {
      if (Date.now() - session.lastAccessed > this.SESSION_TIMEOUT) {
        await this.cleanupSession(socketId);
      }
    }
  }

  private async handleConnection(socket: Socket): Promise<void> {
    console.log("Client connected:", socket.id);

    socket.on('terminal:attach', async (containerId: string) => {
      try {
        console.log('Attaching to container:', containerId);
          await this.attachToContainer(socket, containerId);
        } catch (error) {
          console.error('Failed to attach to container:', error);
          socket.emit('terminal:error', 'Failed to attach to container');
        }
      });

    socket.on("terminal:resize", ({ cols, rows }) => {
      try {
        const session = this.activeSessions.get(socket.id);
        if (session?.ptyProcess) {
          session.ptyProcess.resize(cols, rows);
        }
      } catch (error) {
        console.error("Resize error:", error);
      }
    });

    socket.on("terminal:write", (data) => {
      try {
        this.handleTerminalWrite(socket, data);
      } catch (error) {
        socket.emit("terminal:error", "Failed to write to terminal");
      }
    });

    socket.on("disconnect", () => {
      this.handleDisconnect(socket);
    });
  }

  public async attachToContainer(
    socket: Socket,
    containerId: string,
    cols: number = 80,
    rows: number = 24
  ): Promise<void> {
    try {
      const ptyProcess = pty.spawn(
        "docker",
        ["exec", "-it", containerId, "/bin/bash"],
        {
          name: "xterm-color",
          cols: cols,
          rows: rows,
          env: process.env,
        }
      );

      this.activeSessions.set(socket.id, {
        containerId,
        ptyProcess,
        lastAccessed: Date.now(),
      });

      // Handle PTY output
      ptyProcess.onData((data: string) => {
        socket.emit("terminal:data", data);
      });

      // Handle PTY exit
      ptyProcess.onExit(({ exitCode, signal }) => {
        console.log(
          `PTY process exited with code ${exitCode} and signal ${signal}`
        );
        this.cleanupSession(socket.id);
      });

      socket.emit("terminal:ready", containerId);
    } catch (error) {
      console.error("Failed to attach to container:", error);
      throw error;
    }
  }

  private handleTerminalWrite(socket: Socket, data: string): void {
    const session = this.activeSessions.get(socket.id);
    if (session?.ptyProcess) {
      session.ptyProcess.write(data);
      session.lastAccessed = Date.now();
    }
  }

  private async cleanupSession(socketId: string): Promise<void> {
    const session = this.activeSessions.get(socketId);
    if (session) {
      try {
        if (session.ptyProcess) {
          session.ptyProcess.kill();
        }
        this.activeSessions.delete(socketId);
        console.log(`Session for socket ${socketId} cleaned up successfully.`);
      } catch (error) {
        console.error("Error cleaning up session:", error);
      }
    }
  }

  private async handleDisconnect(socket: Socket): Promise<void> {
    await this.cleanupSession(socket.id);
  }
}

export default SocketService;