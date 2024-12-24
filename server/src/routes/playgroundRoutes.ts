import express from 'express';
import { verifyToken } from '../middleware/authmiddleware';
import { createUserPlayground, getPlaygrounds, startPlayground, stopPlayground } from '../controllers/playgroundController';
import { getUserPlayground, getFile } from '../controllers/fileController';

const router = express.Router();

router.get("/all", verifyToken, getPlaygrounds);

router.get("/files/:id", verifyToken, getUserPlayground);

router.post('/', verifyToken, createUserPlayground);

router.post("/start/:id", verifyToken, startPlayground);

router.post("/stop/:id", verifyToken, stopPlayground);

router.get("/file/:id", verifyToken, getFile);

// router.post("/file/:id", verifyToken, changeFile);

// router.get("/files/:id", verifyToken, getFiles);

export default router;