import axios from 'axios';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import Terminal from '../components/custom/terminal';
import { CodeEditor } from '../components/custom/codeEditor';
import { FileExplorer } from '../components/custom/fileExplorer';
import { createSocketConnection } from '../socket';
import { FileSystemNode } from '../constants';
import { PlaygroundState } from '../constants';
import { Socket } from 'socket.io-client';


const UserPlayground = () => {
  const { id } = useParams();
  if (!id) {
    throw new Error('Playground ID is required');
  }

  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Auth token is required');
  }

  const socket =  createSocketConnection();


  const [playgroundState, setPlaygroundState] = useState<PlaygroundState>({
    containerId: null,
    socket: null,
    isLoading: true,
    error: null
  });
  const [files, setFiles] = useState<FileSystemNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [codeContent, setCodeContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {

    const initializePlayground = async () => {
      try {
        // Load file system structure
        const fileSystemResponse = await axios.get(`/api/playground/files/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setFiles(fileSystemResponse.data.files);
        console.log('Files:', files);

       

        // Start container and terminal
        const containerResponse = await axios.post(
          `/api/playground/start/${id}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`
            }
          }
        );

        // console.log(containerResponse);

        setPlaygroundState(prev => ({
          ...prev,
          containerId: containerResponse.data.containerId,
          // socket,
          isLoading: false
        }));

        // Initialize terminal
          socket.emit('start-terminal', {
            userId: localStorage.getItem('userId'),
            playgroundId: id,
            language: containerResponse.data.language
          });


        toast.success('Playground initialized successfully');
      } catch (error: any) {
        console.error('Error initializing playground:', error);
        setPlaygroundState(prev => ({
          ...prev,
          error: error.message,
          isLoading: false
        }));
        toast.error('Failed to initialize playground');
      }
    };

    initializePlayground();

    return () => {

      if (window.location.pathname !== `/playground/${id}`) {
        if (socket) {
          console.log('Disconnecting socket');
          socket.disconnect();
        }
        cleanup();
      }
    };
  }, []);

  const cleanup = async () => {
    try {
      if (playgroundState.containerId) {
        await axios.post(
          `/api/playground/stop/${id}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`
            }
          }
        );
      }
      console.log('Playground stopped');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };

  const handleFileSelect = async (path: string) => {
    try {
      setSelectedFile(path);
      setIsSaving(true);
      console.log('Selected file:', path);
      const response = await axios.get(`/api/playground/file/${id}`, {
        params: { path },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      setCodeContent(response.data.content);
    } catch (error) {
      console.error('Error loading file:', error);
      toast.error('Failed to load file');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCodeChange = async (newContent: string) => {
    setCodeContent(newContent);

    try {
      setIsSaving(true);
      await axios.post(
        `/api/playground/file/${id}`,
        {
          path: selectedFile,
          content: newContent
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );
    } catch (error) {
      console.error('Error saving file:', error);
      toast.error('Failed to save file');
    } finally {
      setIsSaving(false);
    }
  };

  const getLanguage = () => {
    if (!selectedFile) {
      return 'CPP';
    }

    const extension = selectedFile.split('.').pop();
    switch (extension) {
      case 'js':
        return 'NODEJS';
      case 'py':
        return 'PYTHON';
      default:
        return 'CPP';
    }
  };

  if (playgroundState.isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading playground...</div>;
  }

  if (playgroundState.error) {
    return (
      <div className="flex items-center justify-center h-screen">
        Error: {playgroundState.error}
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex">
        <div className="w-64 bg-gray-900">
          <FileExplorer
            files={files}
            onFileSelect={handleFileSelect}
          />
        </div>
        <div className="flex-1">
          <div className="h-full flex flex-col">
            {selectedFile && (
              <div className="px-4 py-2 bg-gray-800 text-gray-300 text-sm flex justify-between items-center">
                <span>{selectedFile}</span>
                {isSaving && <span className="text-xs">Saving...</span>}
              </div>
            )}
            <div className="flex-1">
              <CodeEditor
                content={codeContent}
                onChange={handleCodeChange}
              // socket={socket}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="h-1/3">
        <div className="p-2 bg-gray-800 text-white text-sm border-t border-gray-700">
          <span>Terminal</span>
        </div>
        {socket && playgroundState.containerId && (
          <Terminal
            playgroundId={id}
            language={getLanguage()}
          socket={socket}
          containerId={playgroundState.containerId}
          />
        )}
      </div>
    </div>
  );
};

export default UserPlayground;