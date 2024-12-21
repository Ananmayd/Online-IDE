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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopPlaygroundContainer = exports.startPlaygroundContainer = void 0;
const dockerode_1 = __importDefault(require("dockerode"));
const path_1 = __importDefault(require("path"));
const stream = __importStar(require("stream"));
const docker = new dockerode_1.default();
const startPlaygroundContainer = (userId, id, language) => __awaiter(void 0, void 0, void 0, function* () {
    const playgroundPath = path_1.default.resolve(__dirname, "../../../user-Playgrounds", `user_${userId}`, `playground_${id}`);
    const imageName = language === "PYTHON"
        ? "python:3.10"
        : language === "NODEJS"
            ? "node:16"
            : "gcc"; // example images
    console.log(`Starting container for user ${userId} in language ${language}`);
    try {
        yield new Promise((resolve, reject) => {
            docker.pull(imageName, (err, pullStream) => {
                if (err) {
                    console.error(`Failed to start pull for ${imageName}:`, err);
                    reject(err);
                    return;
                }
                // Create a progress stream
                pullStream.pipe(new stream.Writable({
                    write(chunk, encoding, callback) {
                        console.log(`Pulling ${imageName}: ${chunk.toString()}`);
                        callback();
                    }
                }));
                docker.modem.followProgress(pullStream, (err) => {
                    if (err) {
                        console.error(`Pull error for ${imageName}:`, err);
                        reject(err);
                    }
                    else {
                        console.log(`Successfully pulled ${imageName}`);
                        resolve(null);
                    }
                });
            });
        });
        const container = yield docker.createContainer({
            Image: imageName,
            Cmd: [language === "PYTHON" ? "python3" : language === "NODEJS" ? "node" : "gcc", "-i"], // Interactive mode
            Tty: true,
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            OpenStdin: true,
            HostConfig: {
                Binds: [`${playgroundPath}:/workspace`], // Mount playground to /workspace
            },
            WorkingDir: "/workspace", // Working directory inside container
        });
        yield container.start();
        console.log(`Container started for user ${userId} in language ${language}`);
        return container.id; // Return the container ID if you want to manage it later
    }
    catch (error) {
        console.error("Error starting container:", error);
        throw new Error("Failed to start playground container");
    }
});
exports.startPlaygroundContainer = startPlaygroundContainer;
const stopPlaygroundContainer = (containerId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const container = docker.getContainer(containerId);
        yield container.stop();
        yield container.remove(); // Optional: remove the container to free up resources
        console.log(`Container ${containerId} stopped and removed.`);
    }
    catch (error) {
        console.error("Error stopping container:", error);
        throw new Error("Failed to stop playground container");
    }
});
exports.stopPlaygroundContainer = stopPlaygroundContainer;
//# sourceMappingURL=dockerServices.js.map