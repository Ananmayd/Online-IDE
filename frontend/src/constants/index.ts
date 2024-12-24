import { Socket } from "socket.io-client";

export const words = [
  {
    text: "Your",
  },
  {
    text: "most",
  },
  {
    text: "trusted",
  },
  {
    text: "Online",
    className: "text-blue-500 dark:text-blue-500",
  },
  {
    text: "IDE.",
    className: "text-blue-500 dark:text-blue-500",
  },
];

export interface Project {
  id: string;
  name: string;
  language: string;
  lastModified: Date;
}

export type Language = "PYTHON" | "CPP" | "NODEJS";

export interface FileSystemNode {
  name: string;
  type: "file" | "folder";
  children?: FileSystemNode[];
  content?: string;
}

export interface PlaygroundState {
  containerId: string | null;
  socket: Socket | null;
  isLoading: boolean;
  error: string | null;
}