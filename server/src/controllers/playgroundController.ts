import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
import { createPlaygroundFromTemplate } from "../services/playgroundServices";
import {
  startPlaygroundContainer,
  stopPlaygroundContainer,
} from "../services/dockerServices";
import { socketObj } from "../app";

const prisma = new PrismaClient();



export const getPlaygrounds = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // console.log(req.user);
    const userId = req.user?.id; // Get the user ID from the request
    console.log("userId: ", userId);

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

    res.status(201).json({
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
  const { id } = req.params;

  try {
    const playground = await prisma.playground.findUnique({
      where: { id: id },
    });

    const userId = await prisma.playground.findUnique({
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

    console.log("playground: ", playground?.containerStatus);

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

    const containerPort =
      Math.floor(Math.random() * (65535 - 49152 + 1)) + 49152;
    // Start the Docker container
    // if (playground.containerStatus !== "RUNNING") {
      const containerId = await startPlaygroundContainer({
        userId: userId?.userId,
        id,
        language: playground.language,
      });
      console.log("conatinerID: ", containerId);

      // Update playground with container details
      await prisma.playground.update({
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
  } catch (error) {
    console.error("Error starting playground container:", error);

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
  const { id } = req.params;

  try {
    const playground = await prisma.playground.findUnique({
      where: {
        id: id,
      },
    });

    if (!playground) {
      res.status(404).json({ message: "Playground not found or unauthorized" });
      return;
    }
    console.log("Stoping conatiner: ", playground.containerStatus);

    if (
      !playground.activeContainerId ||
      playground.containerStatus !== "RUNNING"
    ) {
      res.status(400).json({ message: "No active container to stop" });
      return;
    }

    // Stop the Docker container
    await stopPlaygroundContainer(playground.activeContainerId);

    // Update playground status
    const updatedPlayground = await prisma.playground.update({
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
  } catch (error) {
    console.error("Error stopping playground container:", error);

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
