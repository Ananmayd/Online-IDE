import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { ProjectCard } from '../components/custom/ProjectCard';
import { CreateProjectDialog } from '../components/custom/CreateProject';
import { Project, Language } from '../constants/index';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

function HomePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);

         // Get the token from localStorage
         const token = localStorage.getItem('authToken');

        const response = await axios.get("/api/playground/all", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // console.log("response", response.data);
        setProjects(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Failed to fetch projects. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleCreateProject = async (name: string, language: Language) => {
    try {

      const token = localStorage.getItem('authToken');

      // Create the project in the database
      const newProject = await axios.post<Project>('/api/playground',
        { 
          name, 
          language 
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
    );

      // Redirect to the newly created project's playground
      navigate(`/playground/${newProject.data.id}`);
    } catch (err) {
      console.error('Error creating project:', err);
      
      // Optionally show an error toast or notification
      toast.error('Failed to create project. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Projects</h1>
            <p className="text-gray-400 mt-2">Manage and organize your development projects</p>
          </div>

          <button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-xl transition-colors duration-200"
          >
            <Plus className="w-5 h-5" />
            <span>New Project</span>
          </button>
        </div>

        {isLoading ? (
          <div className="text-center text-xl">Loading projects...</div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : projects.length === 0 ? (
          <div className="text-center text-gray-400">
            No projects found. Create your first project!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <button onClick={() => navigate(`/playground/${project.id}`)}>
                <ProjectCard key={project.id} project={project} />
              </button>
            ))}
          </div>
        )}

        <CreateProjectDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onCreateProject={handleCreateProject}
        />
      </div>
    </div>
  );
}

export default HomePage;