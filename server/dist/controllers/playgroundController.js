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
exports.stopPlayground = exports.startPlayground = exports.createUserPlayground = exports.getUserPlayground = exports.getPlaygrounds = void 0;
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const playgroundServices_1 = require("../services/playgroundServices");
const dockerServices_1 = require("../services/dockerServices");
const prisma = new client_1.PrismaClient();
const playgroundsBaseDir = path_1.default.join(__dirname, "../../../user-Playgrounds");
const getPlaygrounds = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // console.log(req.user);
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // Get the user ID from the request
        if (!userId) {
            res.status(400).json({ error: "User not authenticated" });
            return;
        }
        const playgrounds = yield prisma.playground.findMany({
            where: {
                userId: userId,
            },
        });
        res.status(200).json(playgrounds);
        return;
    }
    catch (error) {
        console.error("Error retrieving playgrounds:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.getPlaygrounds = getPlaygrounds;
const getUserPlayground = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // Get the user ID from the request
        const id = req.params.id; // Get the playground ID from the route parameters
        if (!userId) {
            res.status(400).json({ error: "User not authenticated" });
            return;
        }
        const playgroundDir = path_1.default.join(playgroundsBaseDir, `user_${userId}`, `playground_${id}`);
        // Check if the playground directory exists
        if (!fs_1.default.existsSync(playgroundDir)) {
            res.status(404).json({ error: "Playground not found" });
            return;
        }
        // Read all files in the playground directory
        const files = fs_1.default.readdirSync(playgroundDir);
        const playgroundFiles = {};
        for (const file of files) {
            const filePath = path_1.default.join(playgroundDir, file);
            // Read the file contents
            const content = fs_1.default.readFileSync(filePath, "utf-8");
            playgroundFiles[file] = content; // Store file contents
        }
        res.status(200).json(playgroundFiles);
    }
    catch (error) {
        console.error("Error retrieving playground:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.getUserPlayground = getUserPlayground;
// Create a new playground for a user
const createUserPlayground = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { name, language } = req.body;
    // console.log("reached here");
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(400).json({ error: "User ID not found" });
            return;
        }
        const id = (0, crypto_1.randomBytes)(16).toString("hex");
        yield (0, playgroundServices_1.createPlaygroundFromTemplate)(userId, id, language);
        yield prisma.playground.create({
            data: {
                id: id,
                name,
                language,
                lastModified: new Date(),
                user: {
                    connect: {
                        id: userId,
                    },
                },
            },
        });
        res
            .status(201)
            .json({
            success: true,
            message: "Playground created successfully!",
            id: id,
        });
    }
    catch (error) {
        console.error("Error creating playground:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
exports.createUserPlayground = createUserPlayground;
const startPlayground = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // From your authentication middleware
    const { id } = req.params;
    // console.log("This is the id ", id);
    try {
        // Fetch playground details to get the language
        const playground = yield prisma.playground.findUnique({
            where: { id: id, userId }, // Add userId to ensure user owns the playground
        });
        if (!playground) {
            res.status(404).json({ message: "Playground not found" });
            return;
        }
        // Check if a container is already running
        if (playground.containerStatus === "RUNNING") {
            res.status(400).json({ message: "Playground container already running" });
            return;
        }
        // Dynamically assign a port (you might want a more sophisticated port management)
        const containerPort = Math.floor(Math.random() * (65535 - 49152 + 1)) + 49152;
        // Start the Docker container
        const containerId = yield (0, dockerServices_1.startPlaygroundContainer)(userId.toString(), id, playground.language);
        // Update playground with container details
        const updatedPlayground = yield prisma.playground.update({
            where: { id: id },
            data: {
                activeContainerId: containerId,
                containerStatus: "RUNNING",
                containerStartedAt: new Date(),
                containerPort: containerPort,
            },
        });
        res.json({
            message: "Playground container started",
            containerId,
            port: containerPort,
        });
    }
    catch (error) {
        console.error("Error starting playground container:", error);
        // Optionally update playground status to ERROR
        if (id) {
            yield prisma.playground.update({
                where: { id: id },
                data: {
                    containerStatus: "ERROR",
                },
            });
        }
        res.status(500).json({ message: "Failed to start playground container" });
    }
});
exports.startPlayground = startPlayground;
const stopPlayground = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { id } = req.params;
    try {
        // Fetch the playground with comprehensive checks
        const playground = yield prisma.playground.findUnique({
            where: {
                id: id,
                userId: userId,
            },
        });
        // Validate playground existence and ownership
        if (!playground) {
            res.status(404).json({ message: "Playground not found or unauthorized" });
            return;
        }
        // Check if there's an active container to stop
        if (!playground.activeContainerId ||
            playground.containerStatus !== "RUNNING") {
            res.status(400).json({ message: "No active container to stop" });
            return;
        }
        try {
            // Stop the Docker container
            yield (0, dockerServices_1.stopPlaygroundContainer)(playground.activeContainerId);
        }
        catch (containerStopError) {
            // Log the error but continue with status update
            console.error("Error stopping Docker container:", containerStopError);
        }
        // Update playground to reflect stopped status
        const updatedPlayground = yield prisma.playground.update({
            where: { id: id },
            data: {
                activeContainerId: null,
                containerStatus: "STOPPED",
                containerStartedAt: null,
                containerPort: null,
            },
        });
        res.json({
            message: "Playground container stopped successfully",
            id: updatedPlayground.id,
        });
    }
    catch (error) {
        console.error("Comprehensive error stopping playground container:", error);
        // Attempt to update playground status to error state
        try {
            yield prisma.playground.update({
                where: { id: id },
                data: {
                    containerStatus: "ERROR",
                },
            });
        }
        catch (updateError) {
            console.error("Failed to update playground error status:", updateError);
        }
        res.status(500).json({
            message: "Failed to stop playground container",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.stopPlayground = stopPlayground;
//# sourceMappingURL=playgroundController.js.map