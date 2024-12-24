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
exports.stopPlaygroundContainer = exports.startPlaygroundContainer = void 0;
const dockerode_1 = __importDefault(require("dockerode"));
const path_1 = __importDefault(require("path"));
const docker = new dockerode_1.default();
const startPlaygroundContainer = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId, id, language, }) {
    const playgroundPath = path_1.default.resolve(__dirname, "../../../user-Playgrounds", `user_${userId}`, `playground_${id}`);
    const imageConfig = {
        PYTHON: { image: "python:3.10-slim", shell: "python3" },
        NODEJS: { image: "node:16-slim", shell: "node" },
        CPP: { image: "gcc:latest", shell: "bash" },
    };
    const config = imageConfig[language];
    if (!config)
        throw new Error("Unsupported language");
    try {
        yield pullImage(config.image);
        const container = yield docker.createContainer({
            Image: config.image,
            Cmd: [config.shell],
            Tty: true,
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            OpenStdin: true,
            HostConfig: {
                SecurityOpt: ["no-new-privileges"],
                CapDrop: ["ALL"],
                NetworkMode: "none",
                Binds: [`${playgroundPath}:/workspace:ro`],
                ReadonlyRootfs: true,
            },
            WorkingDir: "/workspace",
            User: "nobody",
        });
        yield container.start();
        return container.id;
    }
    catch (error) {
        console.error("Error starting container:", error);
        throw new Error("Failed to start playground container");
    }
});
exports.startPlaygroundContainer = startPlaygroundContainer;
function pullImage(imageName) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            docker.pull(imageName, (err, stream) => {
                if (err) {
                    reject(err);
                    return;
                }
                docker.modem.followProgress(stream, (err) => err ? reject(err) : resolve());
            });
        });
    });
}
const stopPlaygroundContainer = (containerId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const container = docker.getContainer(containerId);
        yield container.stop({ t: 5 });
        yield container.remove({ force: true });
    }
    catch (error) {
        console.error("Error stopping container:", error);
        throw new Error("Failed to stop playground container");
    }
});
exports.stopPlaygroundContainer = stopPlaygroundContainer;
//# sourceMappingURL=dockerServices.js.map