import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ArrowRight, ArrowLeft, Trash2, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';
import { useProject } from '../context/ProjectContext';

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
}

const COLUMNS = [
  { id: 'To Do', title: 'To Do' },
  { id: 'Reading', title: 'In Progress' },
  { id: 'Completed', title: 'Completed' }
];

const Tasks: React.FC = () => {
  const { activeProject } = useProject();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });

  const fetchTasks = async () => {
    if (!activeProject) return;
    try {
      const res = await api.get(`/projects/${activeProject.id}/tasks`);
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [activeProject]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;
    try {
      await api.post(`/projects/${activeProject.id}/tasks`, { ...formData, status: 'To Do' });
      setIsModalOpen(false);
      setFormData({ title: '', description: '' });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const updateTaskStatus = async (taskId: number, newStatus: string) => {
    if (!activeProject) return;
    try {
      await api.put(`/projects/${activeProject.id}/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (taskId: number) => {
    if (!activeProject) return;
    try {
      await api.delete(`/projects/${activeProject.id}/tasks/${taskId}`);
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const getNextStatus = (current: string) => {
    if (current === 'To Do') return 'Reading';
    if (current === 'Reading') return 'Completed';
    return current;
  };

  const getPrevStatus = (current: string) => {
    if (current === 'Completed') return 'Reading';
    if (current === 'Reading') return 'To Do';
    return current;
  };

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please select a project from the sidebar to view tasks.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Task Board</h1>
          <p className="text-muted-foreground text-sm">Track progress for {activeProject.title}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-xl flex items-center space-x-2 shadow-lg shadow-accent/20 transition-all"
        >
          <Plus size={18} />
          <span>New Task</span>
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {COLUMNS.map((col) => (
          <div key={col.id} className="flex flex-col h-full bg-background/50 border border-border/50 rounded-3xl overflow-hidden p-4">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="font-bold text-foreground">{col.title}</h2>
              <span className="bg-muted text-foreground text-xs font-bold px-2 py-1 rounded-full">
                {tasks.filter(t => t.status === col.id).length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 p-1">
              {tasks.filter(t => t.status === col.id).map(task => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={task.id} 
                  className="glass dark:glass-dark p-4 rounded-2xl border border-border/50 shadow-sm group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-foreground text-sm leading-tight">{task.title}</h3>
                    <button onClick={() => deleteTask(task.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {task.description && <p className="text-xs text-muted-foreground line-clamp-3 mb-4">{task.description}</p>}
                  
                  <div className="flex justify-between items-center mt-2 border-t border-border/50 pt-3">
                    {col.id !== 'To Do' ? (
                      <button onClick={() => updateTaskStatus(task.id, getPrevStatus(task.status))} className="text-xs text-muted-foreground hover:text-foreground flex items-center space-x-1 p-1 bg-muted/50 rounded-lg">
                        <ArrowLeft size={12} /><span>Back</span>
                      </button>
                    ) : <div />}
                    
                    {col.id !== 'Completed' ? (
                      <button onClick={() => updateTaskStatus(task.id, getNextStatus(task.status))} className="text-xs text-accent hover:text-accent/80 flex items-center space-x-1 p-1 bg-accent/10 rounded-lg">
                        <span>Next</span><ArrowRight size={12} />
                      </button>
                    ) : (
                       <CheckCircle2 size={16} className="text-green-500" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md glass dark:glass-dark p-8 rounded-3xl shadow-2xl border border-border/50"
            >
              <h2 className="text-xl font-bold mb-6 text-foreground">Add Task to {activeProject?.title}</h2>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 outline-none focus:border-accent" placeholder="Task Title" />
                </div>
                <div>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 outline-none focus:border-accent resize-none h-24" placeholder="Description (Optional)" />
                </div>
                <div className="pt-4 flex justify-end space-x-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded-xl text-foreground">Cancel</button>
                  <button type="submit" className="bg-accent text-white px-6 py-2 rounded-xl">Add Task</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tasks;
