import { Language } from "@prisma/client";
import Docker from "dockerode";
import path from "path";

const docker = new Docker();

interface ContainerConfig {
  userId: number;
  id: string;
  language: Language;
}

export const startPlaygroundContainer = async ({
  userId,
  id,
  language,
}: ContainerConfig) => {
  const playgroundPath = path.resolve(
    __dirname,
    "../../../user-Playgrounds",
    `user_${userId}`,
    `playground_${id}`
  );

  const imageConfig = {
    PYTHON: { image: "python:3.10-slim", shell: "python3" },
    NODEJS: { image: "node:16-slim", shell: "node" },
    CPP: { image: "gcc:latest", shell: "bash" },
  };

  const config = imageConfig[language as keyof typeof imageConfig];
  if (!config) throw new Error("Unsupported language");

  try {
    await pullImage(config.image);

    const container = await docker.createContainer({
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

    await container.start();
    return container.id;
  } catch (error) {
    console.error("Error starting container:", error);
    throw new Error("Failed to start playground container");
  }
};

async function pullImage(imageName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    docker.pull(imageName, (err: any, stream: any) => {
      if (err) {
        reject(err);
        return;
      }

      docker.modem.followProgress(stream, (err) =>
        err ? reject(err) : resolve()
      );
    });
  });
}

export const stopPlaygroundContainer = async (
  containerId: string
): Promise<void> => {
  try {
    const container = docker.getContainer(containerId);
    await container.stop({ t: 5 });
    await container.remove({ force: true });
  } catch (error) {
    console.error("Error stopping container:", error);
    throw new Error("Failed to stop playground container");
  }
};
