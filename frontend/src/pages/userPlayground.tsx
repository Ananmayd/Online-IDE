import axios from 'axios';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import Terminal from '../components/custom/terminal';
import { CodeEditor } from '../components/custom/codeEditor';
import { FileExplorer } from '../components/custom/fileExplorer';

const initialFiles = [
  {
    name: 'src',
    type: 'folder' as const,
    children: [
      {
        name: 'components',
        type: 'folder' as const,
        children: [
          { name: 'App.tsx', type: 'file' as const },
          { name: 'index.ts', type: 'file' as const },
        ],
      },
      { name: 'main.tsx', type: 'file' as const },
      { name: 'styles.css', type: 'file' as const },
    ],
  },
  {
    name: 'public',
    type: 'folder' as const,
    children: [
      { name: 'index.html', type: 'file' as const },
      { name: 'favicon.ico', type: 'file' as const },
    ],
  },
  { name: 'package.json', type: 'file' as const },
  { name: 'tsconfig.json', type: 'file' as const },
];


const UserPlayground = () => {

  const { id } = useParams();
  if (!id) {
    throw new Error('Playground ID is required');
  }
  const [selectedFile, setSelectedFile] = useState('');
  const [codeContent, setCodeContent] = useState("");
  const [containerId, setContainerId] = useState<string | null>(null);

  useEffect(() => {
    const startPlaygroundContainer = async () => {
      try {
        const token = localStorage.getItem('authToken');

        const response = await axios.post(`/api/playground/start/${id}`, {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setContainerId(response.data.containerId);
        toast.success('Playground container started');
      } catch (error) {
        console.error('Error starting playground container:', error);
        toast.error('Failed to start playground container');
      }
    };

    startPlaygroundContainer();

    // Cleanup function to stop container when component unmounts
    return () => {
      const stopPlaygroundContainer = async () => {
        try {
          const token = localStorage.getItem('authToken');
          await axios.post(`/api/playground/stop/${id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        } catch (error) {
          console.error('Error stopping playground container:', error);
        }
      };

      stopPlaygroundContainer();
    };
  }, []);


  const handleFileSelect = (path: string) => {
    setSelectedFile(path);
    // In a real app, we would load the file content here
    setCodeContent(`// Content of ${path}`);
  };


  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex">
        <div className="w-64">
          <FileExplorer files={initialFiles} onFileSelect={handleFileSelect} />
        </div>
        <div className="flex-1">
          <CodeEditor content={codeContent} onChange={setCodeContent} />
        </div>
      </div>
      <div className="h-1/3">
      <div className="p-2 bg-gray-800 text-white text-sm border-t border-gray-700">
        <span>Terminal</span>
      </div>
        <Terminal userId='' playgroundId={id} language=''/>
      </div>
    </div>
  )
}

export default UserPlayground