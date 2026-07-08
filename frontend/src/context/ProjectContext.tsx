import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

interface Project {
  id: number;
  title: string;
  topic?: string;
  description?: string;
  completion_percentage: number;
  created_at: string;
}

interface ProjectContextType {
  activeProject: Project | null;
  setActiveProject: (project: Project) => void;
  projects: Project[];
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType>({
  activeProject: null,
  setActiveProject: () => {},
  projects: [],
  refreshProjects: async () => {}
});

export const ProjectProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const refreshProjects = async () => {
    try {
      const res = await api.get('/projects/');
      setProjects(res.data);
      if (res.data.length > 0 && !activeProject) {
        setActiveProject(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch projects", err);
    }
  };

  useEffect(() => {
    refreshProjects();
  }, []);

  return (
    <ProjectContext.Provider value={{ activeProject, setActiveProject, projects, refreshProjects }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => useContext(ProjectContext);
