"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const pty = __importStar(require("node-pty"));
class SocketService {
    constructor(io) {
        this.SESSION_TIMEOUT = 3600000; // 1 hour
        this.io = io;
        this.activeSessions = new Map();
        this.initialize();
    }
    initialize() {
        this.io.on("connection", this.handleConnection.bind(this));
        this.setupCleanupInterval();
    }
    setupCleanupInterval() {
        setInterval(() => this.cleanupInactiveSessions(), 300000);
    }
    cleanupInactiveSessions() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const [socketId, session] of this.activeSessions) {
                if (Date.now() - session.lastAccessed > this.SESSION_TIMEOUT) {
                    yield this.cleanupSession(socketId);
                }
            }
        });
    }
    handleConnection(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Client connected:", socket.id);
            socket.on('terminal:attach', (containerId) => __awaiter(this, void 0, void 0, function* () {
                try {
                    console.log('Attaching to container:', containerId);
                    yield this.attachToContainer(socket, containerId);
                }
                catch (error) {
                    console.error('Failed to attach to container:', error);
                    socket.emit('terminal:error', 'Failed to attach to container');
                }
            }));
            socket.on("terminal:resize", ({ cols, rows }) => {
                try {
                    const session = this.activeSessions.get(socket.id);
                    if (session === null || session === void 0 ? void 0 : session.ptyProcess) {
                        session.ptyProcess.resize(cols, rows);
                    }
                }
                catch (error) {
                    console.error("Resize error:", error);
                }
            });
            socket.on("terminal:write", (data) => {
                try {
                    this.handleTerminalWrite(socket, data);
                }
                catch (error) {
                    socket.emit("terminal:error", "Failed to write to terminal");
                }
            });
            socket.on("disconnect", () => {
                this.handleDisconnect(socket);
            });
        });
    }
    attachToContainer(socket_1, containerId_1) {
        return __awaiter(this, arguments, void 0, function* (socket, containerId, cols = 80, rows = 24) {
            try {
                const ptyProcess = pty.spawn("docker", ["exec", "-it", containerId, "/bin/bash"], {
                    name: "xterm-color",
                    cols: cols,
                    rows: rows,
                    env: process.env,
                });
                this.activeSessions.set(socket.id, {
                    containerId,
                    ptyProcess,
                    lastAccessed: Date.now(),
                });
                // Handle PTY output
                ptyProcess.onData((data) => {
                    socket.emit("terminal:data", data);
                });
                // Handle PTY exit
                ptyProcess.onExit(({ exitCode, signal }) => {
                    console.log(`PTY process exited with code ${exitCode} and signal ${signal}`);
                    this.cleanupSession(socket.id);
                });
                socket.emit("terminal:ready", containerId);
            }
            catch (error) {
                console.error("Failed to attach to container:", error);
                throw error;
            }
        });
    }
    handleTerminalWrite(socket, data) {
        const session = this.activeSessions.get(socket.id);
        if (session === null || session === void 0 ? void 0 : session.ptyProcess) {
            session.ptyProcess.write(data);
            session.lastAccessed = Date.now();
        }
    }
    cleanupSession(socketId) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = this.activeSessions.get(socketId);
            if (session) {
                try {
                    if (session.ptyProcess) {
                        session.ptyProcess.kill();
                    }
                    this.activeSessions.delete(socketId);
                    console.log(`Session for socket ${socketId} cleaned up successfully.`);
                }
                catch (error) {
                    console.error("Error cleaning up session:", error);
                }
            }
        });
    }
    handleDisconnect(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.cleanupSession(socket.id);
        });
    }
}
exports.default = SocketService;
//# sourceMappingURL=socketServices.js.map