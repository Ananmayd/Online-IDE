"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRole = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verifyToken = (req, res, next) => {
    var _a;
    const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
    // console.log('token :', token);
    if (!token) {
        res.status(401).json({ error: 'Access denied' });
        return;
    }
    try {
        const verified = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        // console.log('verified', verified);
        next();
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid token' });
    }
};
exports.verifyToken = verifyToken;
const checkRole = (role) => {
    return (req, res, next) => {
        var _a;
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== role) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        next();
    };
};
exports.checkRole = checkRole;
//# sourceMappingURL=authmiddleware.js.map