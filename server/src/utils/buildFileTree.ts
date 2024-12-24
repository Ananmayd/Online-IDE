import path from 'path';
import fs from 'fs';

interface FileNode {
    name: string;
    type: 'file' | 'folder';
    children?: FileNode[];
    content?: string;
  }

export function buildFileTree(dirPath: string): FileNode[] {
    const items = fs.readdirSync(dirPath);
    const tree: FileNode[] = [];
  
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stats = fs.statSync(fullPath);
  
      if (stats.isDirectory()) {
        // It's a directory, recursively build its tree
        tree.push({
          name: item,
          type: 'folder',
          children: buildFileTree(fullPath)
        });
      } else {
        // It's a file, read its content
        let content: string | undefined;
        try {
          // Read file content for text files
          const ext = path.extname(item).toLowerCase();
          const textExtensions = ['.txt', '.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.json', '.md'];
          
          if (textExtensions.includes(ext)) {
            content = fs.readFileSync(fullPath, 'utf-8');
          }
        } catch (error) {
          console.error(`Error reading file ${item}:`, error);
        }
  
        tree.push({
          name: item,
          type: 'file',
          content
        });
      }
    }
  
    // Sort items: folders first, then files, both alphabetically
    return tree.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === 'folder' ? -1 : 1;
    });
  }