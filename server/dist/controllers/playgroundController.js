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
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopPlayground = exports.startPlayground = exports.createUserPlayground = exports.getPlaygrounds = void 0;
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const playgroundServices_1 = require("../services/playgroundServices");
const dockerServices_1 = require("../services/dockerServices");
const prisma = new client_1.PrismaClient();
const getPlaygrounds = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // console.log(req.user);
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // Get the user ID from the request
        console.log("userId: ", userId);
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
        res.status(201).json({
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
    const { id } = req.params;
    try {
        const playground = yield prisma.playground.findUnique({
            where: { id: id },
        });
        const userId = yield prisma.playground.findUnique({
            where: { id: id },
            select: {
                userId: true,
            },
        });
        // console.log("userId: ",userId?.userId);
        if (!userId) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        console.log("playground: ", playground === null || playground === void 0 ? void 0 : playground.containerStatus);
        if (!playground) {
            res.status(404).json({ message: "Playground not found" });
            return;
        }
        console.log("Reached Checkpoint ", playground.containerStatus);
        // if (playground.containerStatus === "RUNNING") {
        //   console.log("Already running");
        //     res.status(400).json({ message: "Playground container already running" });
        //     return;
        //   }
        const containerPort = Math.floor(Math.random() * (65535 - 49152 + 1)) + 49152;
        // Start the Docker container
        // if (playground.containerStatus !== "RUNNING") {
        const containerId = yield (0, dockerServices_1.startPlaygroundContainer)({
            userId: userId === null || userId === void 0 ? void 0 : userId.userId,
            id,
            language: playground.language,
        });
        console.log("conatinerID: ", containerId);
        // Update playground with container details
        yield prisma.playground.update({
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
        // }
    }
    catch (error) {
        console.error("Error starting playground container:", error);
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
    const { id } = req.params;
    try {
        const playground = yield prisma.playground.findUnique({
            where: {
                id: id,
            },
        });
        if (!playground) {
            res.status(404).json({ message: "Playground not found or unauthorized" });
            return;
        }
        console.log("Stoping conatiner: ", playground.containerStatus);
        if (!playground.activeContainerId ||
            playground.containerStatus !== "RUNNING") {
            res.status(400).json({ message: "No active container to stop" });
            return;
        }
        // Stop the Docker container
        yield (0, dockerServices_1.stopPlaygroundContainer)(playground.activeContainerId);
        // Update playground status
        const updatedPlayground = yield prisma.playground.update({
            where: { id: id },
            data: {
                activeContainerId: null,
                containerStatus: "STOPPED",
                containerStartedAt: null,
                containerPort: null,
            },
        });
        console.log("Reached checkpoint 2", playground.containerStatus);
        res.json({
            message: "Playground container stopped successfully",
            id: updatedPlayground.id,
        });
    }
    catch (error) {
        console.error("Error stopping playground container:", error);
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