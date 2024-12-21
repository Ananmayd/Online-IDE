import Docker from "dockerode";
import path from "path";
import * as stream from 'stream';

const docker = new Docker();

export const startPlaygroundContainer = async (
  userId: string,
  id: string,
  language: string
) => {
  const playgroundPath = path.resolve(
    __dirname,
    "../../../user-Playgrounds",
    `user_${userId}`,
    `playground_${id}`
  );
  const imageName =
    language === "PYTHON"
      ? "python:3.10"
      : language === "NODEJS"
      ? "node:16"
      : "gcc"; // example images
  console.log(`Starting container for user ${userId} in language ${language}`);
  try {
    await new Promise((resolve, reject) => {
      docker.pull(imageName, (err: any, pullStream: any) => {
        if (err) {
          console.error(`Failed to start pull for ${imageName}:`, err);
          reject(err);
          return;
        }

        // Create a progress stream
        pullStream.pipe(
          new stream.Writable({
            write(chunk, encoding, callback) {
              console.log(`Pulling ${imageName}: ${chunk.toString()}`);
              callback();
            }
          })
        );

        docker.modem.followProgress(pullStream, 
          (err) => {
            if (err) {
              console.error(`Pull error for ${imageName}:`, err);
              reject(err);
            } else {
              console.log(`Successfully pulled ${imageName}`);
              resolve(null);
            }
          }
        );
      });
    });

    const container = await docker.createContainer({
      Image: imageName,
      Cmd: [language === "PYTHON" ? "python3" : language === "NODEJS" ? "node" : "gcc", "-i"], // Interactive mode
      Tty: true,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      OpenStdin: true,
      HostConfig: {
        Binds: [`${playgroundPath}:/workspace`], // Mount playground to /workspace
      },
      WorkingDir: "/workspace", // Working directory inside container
    });

    await container.start();
    console.log(`Container started for user ${userId} in language ${language}`);

    return container.id; // Return the container ID if you want to manage it later
  } catch (error) {
    console.error("Error starting container:", error);
    throw new Error("Failed to start playground container");
  }
};

export const stopPlaygroundContainer = async (
  containerId: string
): Promise<void> => {
  try {
    const container = docker.getContainer(containerId);
    await container.stop();
    await container.remove(); // Optional: remove the container to free up resources
    console.log(`Container ${containerId} stopped and removed.`);
  } catch (error) {
    console.error("Error stopping container:", error);
    throw new Error("Failed to stop playground container");
  }
};
