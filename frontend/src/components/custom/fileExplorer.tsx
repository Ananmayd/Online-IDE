import React from 'react';
import { Folder, File, ChevronRight, ChevronDown } from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  isOpen?: boolean;
}

interface FileExplorerProps {
  files?: FileNode[];
  onFileSelect: (path: string) => void;
}

const FileTreeNode: React.FC<{ 
  node: FileNode; 
  level: number; 
  path: string; 
  onFileSelect: (path: string) => void 
}> = ({
  node,
  level,
  path,
  onFileSelect,
}) => {
  const [isOpen, setIsOpen] = React.useState(node.isOpen || false);
  const fullPath = `${path}/${node.name}`;

  const handleClick = () => {
    if (node.type === 'folder') {
      setIsOpen(!isOpen);
    } else {
      onFileSelect(fullPath);
    }
  };

  return (
    <div className="select-none">
      <div
        className="flex items-center hover:bg-gray-500 py-1 px-2 cursor-pointer"
        style={{ paddingLeft: `${level * 12}px` }}
        onClick={handleClick}
      >
        <span className="mr-1">
          {node.type === 'folder' ? (
            isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          ) : null}
        </span>
        {node.type === 'folder' ? (
          <Folder size={16} className="mr-1 text-blue-500" />
        ) : (
          <File size={16} className="mr-1 text-gray-500" />
        )}
        <span className="text-sm">{node.name}</span>
      </div>
      {node.type === 'folder' && isOpen && node.children && (
        <div>
          {node.children.map((child: FileNode, index: number) => (
            <FileTreeNode
              key={`${fullPath}-${child.name}-${index}`}
              node={child}
              level={level + 1}
              path={fullPath}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({ files = [], onFileSelect }) => {
  if (!files || files.length === 0) {
    return (
      <div className="h-full bg-gray-900 border-r border-gray-500">
        <div className="p-2 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-white">Explorer</h2>
        </div>
        <div className="p-4 text-gray-400 text-sm">
          No files available
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900 border-r border-gray-500">
      <div className="p-2 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-white">Explorer</h2>
      </div>
      <div className="overflow-auto text-white">
        {files.map((file: FileNode, index: number) => (
          <FileTreeNode 
            key={`root-${file.name}-${index}`} 
            node={file} 
            level={0} 
            path="" 
            onFileSelect={onFileSelect} 
          />
        ))}
      </div>
    </div>
  );
};