import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { createPlaygroundFromTemplate } from "../services/playgroundServices";
import { startPlaygroundContainer, stopPlaygroundContainer } from "../services/dockerServices";

const prisma = new PrismaClient();

const playgroundsBaseDir = path.join(__dirname, "../../../user-Playgrounds");

export const getPlaygrounds = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // console.log(req.user);
    const userId = req.user?.id; // Get the user ID from the request

    if (!userId) {
      res.status(400).json({ error: "User not authenticated" });
      return;
    }

    const playgrounds = await prisma.playground.findMany({
      where: {
        userId: userId,
      },
    });

    res.status(200).json(playgrounds);
    return;
  } catch (error) {
    console.error("Error retrieving playgrounds:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

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

    // Check if the playground directory exists
    if (!fs.existsSync(playgroundDir)) {
      res.status(404).json({ error: "Playground not found" });
      return;
    }

    // Read all files in the playground directory
    const files = fs.readdirSync(playgroundDir);
    const playgroundFiles: any = {};

    for (const file of files) {
      const filePath = path.join(playgroundDir, file);
      // Read the file contents
      const content = fs.readFileSync(filePath, "utf-8");
      playgroundFiles[file] = content; // Store file contents
    }

    res.status(200).json(playgroundFiles);
  } catch (error) {
    console.error("Error retrieving playground:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create a new playground for a user
export const createUserPlayground = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { name, language } = req.body;

  // console.log("reached here");

  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({ error: "User ID not found" });
      return;
    }

    const id = randomBytes(16).toString("hex");

    await createPlaygroundFromTemplate(userId, id, language);

    await prisma.playground.create({
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
  } catch (error) {
    console.error("Error creating playground:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const startPlayground = async (
  req: Request,
  res: Response
): Promise<void> => {
  
  const userId = req.user?.id; // From your authentication middleware
  const { id } = req.params;
  // console.log("This is the id ", id);
  
  try {
    // Fetch playground details to get the language
    const playground = await prisma.playground.findUnique({
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
    const containerPort =
      Math.floor(Math.random() * (65535 - 49152 + 1)) + 49152;

    // Start the Docker container
    const containerId = await startPlaygroundContainer(
      userId.toString(),
      id,
      playground.language
    );

    // Update playground with container details
    const updatedPlayground = await prisma.playground.update({
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
  } catch (error) {
    console.error("Error starting playground container:", error);

    // Optionally update playground status to ERROR
    if (id) {
      await prisma.playground.update({
        where: { id: id },
        data: {
          containerStatus: "ERROR",
        },
      });
    }

    res.status(500).json({ message: "Failed to start playground container" });
  }
};

export const stopPlayground = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  const { id } = req.params;

  try {
    // Fetch the playground with comprehensive checks
    const playground = await prisma.playground.findUnique({
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
    if (
      !playground.activeContainerId ||
      playground.containerStatus !== "RUNNING"
    ) {
      res.status(400).json({ message: "No active container to stop" });
      return;
    }

    try {
      // Stop the Docker container
      await stopPlaygroundContainer(playground.activeContainerId);
    } catch (containerStopError) {
      // Log the error but continue with status update
      console.error("Error stopping Docker container:", containerStopError);
    }

    // Update playground to reflect stopped status
    const updatedPlayground = await prisma.playground.update({
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
  } catch (error) {
    console.error("Comprehensive error stopping playground container:", error);

    // Attempt to update playground status to error state
    try {
      await prisma.playground.update({
        where: { id: id },
        data: {
          containerStatus: "ERROR",
        },
      });
    } catch (updateError) {
      console.error("Failed to update playground error status:", updateError);
    }

    res.status(500).json({
      message: "Failed to stop playground container",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
