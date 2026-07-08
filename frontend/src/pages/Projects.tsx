import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, Clock, Loader2, X, Edit2, Trash2 } from 'lucide-react';
import api from '../lib/api';
import { useProject } from '../context/ProjectContext';

const Projects: React.FC = () => {
  const { projects, refreshProjects } = useProject();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({ title: '', topic: '', description: '', completion_percentage: 0 });
  const [editingId, setEditingId] = useState<number | null>(null);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ title: '', topic: '', description: '', completion_percentage: 0 });
    setIsModalOpen(true);
  };

  const openEditModal = (project: any) => {
    setEditingId(project.id);
    setFormData({ 
      title: project.title, 
      topic: project.topic || '', 
      description: project.description || '',
      completion_percentage: project.completion_percentage || 0
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this project? This cannot be undone.")) return;
    try {
      await api.delete(`/projects/${id}`);
      await refreshProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (editingId) {
        await api.put(`/projects/${editingId}`, formData);
      } else {
        await api.post('/projects/', formData);
      }
      setIsModalOpen(false);
      await refreshProjects();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Research Projects</h1>
          <p className="text-muted-foreground text-sm">Manage and organize your academic endeavors.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors shadow-lg shadow-accent/20"
        >
          <Plus size={18} />
          <span>New Project</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="glass dark:glass-dark rounded-3xl p-10 flex flex-col items-center justify-center border border-border/50">
          <BookOpen size={48} className="text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">No projects yet</h2>
          <p className="text-muted-foreground text-sm mb-6 text-center max-w-sm">Create your first research project to start organizing papers, tasks, and findings.</p>
          <button onClick={openCreateModal} className="bg-accent text-white px-6 py-2 rounded-xl">Create Project</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={project.id} 
              className="glass dark:glass-dark p-6 rounded-2xl flex flex-col border border-border/50 hover:border-accent/50 transition-colors group relative"
            >
              {/* Edit/Delete Actions (shown when 100% complete or on hover) */}
              <div className={`absolute top-4 right-4 flex space-x-2 transition-opacity ${project.completion_percentage === 100 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <button onClick={(e) => { e.stopPropagation(); openEditModal(project); }} className="p-2 bg-background/80 hover:bg-accent hover:text-white rounded-lg transition-colors text-muted-foreground">
                  <Edit2 size={16} />
                </button>
                <button onClick={(e) => handleDelete(e, project.id)} className="p-2 bg-background/80 hover:bg-destructive hover:text-white rounded-lg transition-colors text-muted-foreground">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex-1 mt-2">
                <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-accent transition-colors pr-16">{project.title}</h3>
                {project.topic && <p className="text-xs font-medium text-purple-500 mb-3 uppercase tracking-wider">{project.topic}</p>}
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {project.description || "No description provided."}
                </p>
              </div>
              
              <div className="pt-4 border-t border-border/50 flex justify-between items-center text-sm text-muted-foreground mt-4">
                <div className="flex items-center space-x-1">
                  <Clock size={14} />
                  <span>{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-2 bg-background rounded-full overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: `${project.completion_percentage}%` }} />
                  </div>
                  <span className="text-xs">{project.completion_percentage}%</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg glass dark:glass-dark p-8 rounded-3xl shadow-2xl border border-border/50"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-2xl font-bold mb-6 text-foreground">{editingId ? 'Edit Project' : 'Create New Project'}</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground/80 ml-1">Title</label>
                  <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all mt-1" placeholder="Project Title" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground/80 ml-1">Topic (Optional)</label>
                  <input value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all mt-1" placeholder="e.g. Machine Learning" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground/80 ml-1">Description (Optional)</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all mt-1 resize-none h-24" placeholder="Briefly describe the research..." />
                </div>
                
                {editingId && (
                  <div>
                    <label className="text-sm font-medium text-foreground/80 ml-1">Completion Percentage ({formData.completion_percentage}%)</label>
                    <input 
                      type="range" min="0" max="100" 
                      value={formData.completion_percentage} 
                      onChange={e => setFormData({...formData, completion_percentage: parseInt(e.target.value)})} 
                      className="w-full mt-2 accent-accent" 
                    />
                  </div>
                )}
                
                <div className="pt-4 flex justify-end space-x-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl hover:bg-muted/50 transition-colors text-foreground font-medium">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90 text-white px-6 py-2.5 rounded-xl flex items-center shadow-lg shadow-accent/20 transition-all disabled:opacity-70">
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <span>{editingId ? 'Save Changes' : 'Create'}</span>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Projects;
