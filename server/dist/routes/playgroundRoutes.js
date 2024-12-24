"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authmiddleware_1 = require("../middleware/authmiddleware");
const playgroundController_1 = require("../controllers/playgroundController");
const fileController_1 = require("../controllers/fileController");
const router = express_1.default.Router();
router.get("/all", authmiddleware_1.verifyToken, playgroundController_1.getPlaygrounds);
router.get("/files/:id", authmiddleware_1.verifyToken, fileController_1.getUserPlayground);
router.post('/', authmiddleware_1.verifyToken, playgroundController_1.createUserPlayground);
router.post("/start/:id", authmiddleware_1.verifyToken, playgroundController_1.startPlayground);
router.post("/stop/:id", authmiddleware_1.verifyToken, playgroundController_1.stopPlayground);
router.get("/file/:id", authmiddleware_1.verifyToken, fileController_1.getFile);
// router.post("/file/:id", verifyToken, changeFile);
// router.get("/files/:id", verifyToken, getFiles);
exports.default = router;
//# sourceMappingURL=playgroundRoutes.js.map