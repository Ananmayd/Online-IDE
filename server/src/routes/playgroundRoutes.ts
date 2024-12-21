import express from 'express';
import { verifyToken } from '../middleware/authmiddleware';
import { createUserPlayground, getPlaygrounds, getUserPlayground, startPlayground, stopPlayground } from '../controllers/playgroundController';

const router = express.Router();

router.get("/all", verifyToken, getPlaygrounds);

router.get("/:id", verifyToken, getUserPlayground);

router.post('/', verifyToken, createUserPlayground);

router.post("/start/:id", verifyToken, startPlayground);

router.post("/stop/:id", verifyToken, stopPlayground);

export default router;