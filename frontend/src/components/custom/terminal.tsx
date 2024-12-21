import { Terminal as XTerminal } from "@xterm/xterm";
import {FitAddon} from '@xterm/addon-fit';
import { useEffect, useRef, useState } from "react";
import '@xterm/xterm/css/xterm.css';
import socket from "../../socket";

interface TerminalProps {
  userId: string;
  playgroundId: string;
  language: "PYTHON" | "NODEJS" | "C";
}

const Terminal = ({ userId, playgroundId, language }: TerminalProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<XTerminal | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerminal({
      rows: 30,
      cols: 80,
      cursorBlink: true,
      cursorStyle: 'block',
      theme: {
        background: '#1e1e1e',
      }
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();
    terminalInstance.current = term;

    // Start terminal session
    socket.emit('start-terminal', {
      userId,
      playgroundId,
      language
    });

    // Terminal ready event
    socket.on('terminal:ready', (containerId) => {
      setIsConnected(true);
      term.write(`\r\n🚀 Connected to ${language} environment\r\n`);
    });

    // Handle terminal input
    term.onData((data) => {
      if (isConnected) {
        socket.emit('terminal:write', data);
      }
    });

    // Handle terminal output
    socket.on('terminal:data', (data: string) => {
      term.write(data);
    });

    // Handle errors
    socket.on('terminal:error', (error: string) => {
      term.write(`\r\n❌ Error: ${error}\r\n`);
      setIsConnected(false);
    });

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      socket.off('terminal:ready');
      socket.off('terminal:data');
      socket.off('terminal:error');
      term.dispose();
    };
  }, [userId, playgroundId, language]);

  return (
    <div 
      ref={terminalRef} 
      className="h-full w-full bg-black"
      style={{ padding: '10px' }}
    />
  );
};

export default Terminal;