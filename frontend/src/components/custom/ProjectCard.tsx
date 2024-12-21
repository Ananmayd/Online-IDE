import { Calendar, Code2 } from 'lucide-react';
import { Project } from '../../constants/index';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors duration-200 border border-gray-700">
      <h3 className="text-xl font-semibold text-white mb-2">{project.name}</h3>
      <div className="flex items-center space-x-4 text-gray-400">
        <div className="flex items-center">
          <Code2 className="w-4 h-4 mr-2" />
          <span>{project.language}</span>
        </div>
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          <span>{new Date(project.lastModified).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}