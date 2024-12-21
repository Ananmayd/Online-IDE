"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dockerode_1 = __importDefault(require("dockerode"));
const dockerServices_1 = require("./dockerServices");
class SocketService {
    constructor(io) {
        this.io = io;
        this.activeSessions = new Map();
        this.docker = new dockerode_1.default();
        this.initialize();
    }
    initialize() {
        this.io.on('connection', this.handleConnection.bind(this));
    }
    handleConnection(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Client connected:', socket.id);
            socket.on('start-terminal', (data) => __awaiter(this, void 0, void 0, function* () {
                yield this.handleStartTerminal(socket, data);
            }));
            socket.on('terminal:write', (data) => {
                this.handleTerminalWrite(socket, data);
            });
            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });
        });
    }
    handleStartTerminal(socket_1, _a) {
        return __awaiter(this, arguments, void 0, function* (socket, { userId, playgroundId, language }) {
            try {
                const containerId = yield (0, dockerServices_1.startPlaygroundContainer)(userId, playgroundId, language);
                const container = this.docker.getContainer(containerId);
                const exec = yield container.exec({
                    Cmd: [language === "PYTHON" ? "/bin/bash" :
                            language === "NODEJS" ? "/bin/bash" : "/bin/bash"],
                    AttachStdin: true,
                    AttachStdout: true,
                    AttachStderr: true,
                    Tty: true,
                    WorkingDir: "/workspace"
                });
                const stream = yield exec.start({
                    hijack: true,
                    stdin: true
                });
                this.activeSessions.set(socket.id, {
                    containerId,
                    stream
                });
                // Handle terminal output
                stream.on('data', (data) => {
                    socket.emit('terminal:data', data.toString());
                });
                stream.on('error', (error) => {
                    console.error('Stream error:', error);
                    socket.emit('terminal:error', 'Terminal error occurred');
                });
                socket.emit('terminal:ready', containerId);
            }
            catch (error) {
                console.error('Failed to start terminal:', error);
                socket.emit('terminal:error', 'Failed to start terminal');
            }
        });
    }
    handleTerminalWrite(socket, data) {
        const session = this.activeSessions.get(socket.id);
        if (session && session.stream.writable) {
            session.stream.write(data);
        }
    }
    handleDisconnect(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = this.activeSessions.get(socket.id);
            if (session) {
                try {
                    yield (0, dockerServices_1.stopPlaygroundContainer)(session.containerId);
                    this.activeSessions.delete(socket.id);
                    console.log(`Cleaned up session for socket ${socket.id}`);
                }
                catch (error) {
                    console.error('Error cleaning up session:', error);
                }
            }
        });
    }
}
exports.default = SocketService;
//# sourceMappingURL=socketServices.js.map