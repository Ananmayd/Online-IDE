import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { buildFileTree } from "../utils/buildFileTree";

const playgroundsBaseDir = path.join(__dirname, "../../../user-Playgrounds");

export const getUserPlayground = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id; // Get the user ID from the request
    const id = req.params.id; // Get the playground ID from the route parameters

    if (!userId) {
      res.status(400).json({ error: "User not authenticated" });
      return;
    }

    const playgroundDir = path.join(
      playgroundsBaseDir,
      `user_${userId}`,
      `playground_${id}`
    );

    // console.log("Playground directory:", playgroundDir);
    // Check if the playground directory exists
    if (!fs.existsSync(playgroundDir)) {
      res.status(404).json({ error: "Playground not found" });
      return;
    }


    const fileTree = buildFileTree(playgroundDir);

    
    // console.log("Playground files:", playgroundFiles);
    res.status(200).json({files: fileTree});
  } catch (error) {
    console.error("Error retrieving playground:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const filepath = req.query.path as string;
    console.log("File path:", filepath);
    const userId = req.user?.id;
    const id = req.params.id;
    const playgroundDir = path.join(
      playgroundsBaseDir,
      `user_${userId}`,
      `playground_${id}`
    );
    const file = path.join(playgroundDir, filepath);
    if (!fs.existsSync(file)) {
      res.status(404).json({ error: "File not found" });
      return;
    }
    const content = fs.readFileSync(file, "utf-8");
    console.log("File content:", content);
    res.status(200).json({ content });
  } catch (error) {
    console.error("Error retrieving file:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
