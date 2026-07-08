import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { motion } from 'framer-motion';
import { Plus, UploadCloud, FileText, Loader2, ArrowRight, Folder } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { setActiveProject } = useProject();
  const [stats, setStats] = useState({ projects: 0, papers: 0, tasks: 0 });
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const projRes = await api.get('/projects/');
        const projData = projRes.data;
        
        setProjects(projData);
        
        // Sum up total papers and tasks across all projects
        const totalPapers = projData.reduce((acc: number, p: any) => acc + (p.paper_count || 0), 0);
        const totalTasks = projData.reduce((acc: number, p: any) => acc + (p.task_count || 0), 0);

        setStats({
          projects: projData.length,
          papers: totalPapers,
          tasks: totalTasks
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Poll every 5s for updates
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-accent to-purple-500 bg-clip-text text-transparent inline-block">
          Welcome back, {user?.full_name?.split(' ')[0] || 'Researcher'}
        </h1>
        <p className="text-muted-foreground mt-1">Ready to discover something new today?</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Total Projects', value: loading ? <Loader2 className="animate-spin" size={24} /> : stats.projects, color: 'from-blue-500/20 to-blue-500/5', border: 'border-blue-500/20' },
          { title: 'Total Papers Uploaded', value: loading ? <Loader2 className="animate-spin" size={24} /> : stats.papers, color: 'from-purple-500/20 to-purple-500/5', border: 'border-purple-500/20' },
          { title: 'Total Tasks', value: loading ? <Loader2 className="animate-spin" size={24} /> : stats.tasks, color: 'from-accent/20 to-accent/5', border: 'border-accent/20' },
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
            transition={{ delay: i * 0.1, duration: 0.2 }}
            key={i} 
            className={`glass dark:glass-dark p-6 rounded-3xl flex flex-col items-start justify-center shadow-sm border ${stat.border} bg-gradient-to-br ${stat.color}`}
          >
            <p className="text-sm font-medium text-foreground/80 mb-2">{stat.title}</p>
            <p className="text-4xl font-bold text-foreground">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/projects" className="glass dark:glass-dark p-5 rounded-2xl border border-border/50 hover:border-accent/50 hover:bg-background/50 transition-all group flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-accent/10 text-accent rounded-xl group-hover:scale-110 transition-transform"><Plus size={20} /></div>
              <div>
                <p className="font-medium text-foreground">New Project</p>
                <p className="text-xs text-muted-foreground">Start a new research topic</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          <Link to="/papers" className="glass dark:glass-dark p-5 rounded-2xl border border-border/50 hover:border-purple-500/50 hover:bg-background/50 transition-all group flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl group-hover:scale-110 transition-transform"><UploadCloud size={20} /></div>
              <div>
                <p className="font-medium text-foreground">Upload Papers</p>
                <p className="text-xs text-muted-foreground">Extract AI summaries</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          <Link to="/tasks" className="glass dark:glass-dark p-5 rounded-2xl border border-border/50 hover:border-blue-500/50 hover:bg-background/50 transition-all group flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl group-hover:scale-110 transition-transform"><FileText size={20} /></div>
              <div>
                <p className="font-medium text-foreground">Add Task</p>
                <p className="text-xs text-muted-foreground">Manage your kanban board</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>
      </div>

      {/* Project Overview */}
      <div className="pt-4">
        <h2 className="text-lg font-semibold text-foreground mb-4">Project Overview</h2>
        {projects.length === 0 && !loading ? (
          <p className="text-muted-foreground text-sm">No projects found. Create one to get started.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={proj.id}
                onClick={() => setActiveProject(proj)}
                className="glass dark:glass-dark p-5 rounded-2xl border border-border/50 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer hover:border-accent/30"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-accent/10 text-accent rounded-lg">
                    <Folder size={20} />
                  </div>
                  <h3 className="font-semibold text-foreground truncate">{proj.title}</h3>
                </div>
                
                <div className="flex space-x-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Papers: </span>
                    <span className="font-medium text-foreground">{proj.paper_count || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tasks: </span>
                    <span className="font-medium text-foreground">{proj.task_count || 0}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Dashboard;
