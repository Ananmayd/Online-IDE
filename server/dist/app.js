"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketObj = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const playgroundRoutes_1 = __importDefault(require("./routes/playgroundRoutes"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const socketServices_1 = __importDefault(require("./services/socketServices"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const corsOptions = {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use('/api/auth', authRoutes_1.default);
app.use('/api/playground', playgroundRoutes_1.default);
const httpServer = http_1.default.createServer(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
    },
    pingTimeout: 60000,
    maxHttpBufferSize: 1e6,
});
exports.socketObj = new socketServices_1.default(io);
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=app.js.map