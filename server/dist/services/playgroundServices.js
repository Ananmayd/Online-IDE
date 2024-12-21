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
exports.createPlaygroundFromTemplate = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const templatesDir = path_1.default.join(__dirname, "../../../templates");
const createPlaygroundFromTemplate = (userId, playgroundId, language) => __awaiter(void 0, void 0, void 0, function* () {
    const userPlaygroundDir = path_1.default.join(__dirname, "../../../user-Playgrounds", `user_${userId}`, `playground_${playgroundId}`);
    // Ensure the user's playground directory exists
    fs_1.default.mkdirSync(userPlaygroundDir, { recursive: true });
    // Path to the selected language template folder
    const templatePath = path_1.default.join(templatesDir, language);
    // Copy each file from the template to the user's playground directory
    fs_1.default.readdirSync(templatePath).forEach((file) => {
        const sourceFile = path_1.default.join(templatePath, file);
        const destFile = path_1.default.join(userPlaygroundDir, file);
        fs_1.default.copyFileSync(sourceFile, destFile);
    });
    // console.log(`Playground created for user ${userId} with language ${language}`);
});
exports.createPlaygroundFromTemplate = createPlaygroundFromTemplate;
//# sourceMappingURL=playgroundServices.js.map