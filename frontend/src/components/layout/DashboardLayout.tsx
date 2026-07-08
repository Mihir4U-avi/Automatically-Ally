import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Settings, LogOut, FileText, ChevronDown, Check, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardLayout: React.FC = () => {
  const { logout, user } = useAuth();
  const { activeProject, setActiveProject, projects } = useProject();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: BookOpen },
    { name: 'Papers', path: '/papers', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Glass Sidebar */}
      <aside className="w-64 glass dark:glass-dark hidden md:flex flex-col m-4 rounded-2xl z-10 shadow-lg">
        <div className="p-6">
          <h2 className="text-xl font-bold bg-gradient-to-r from-accent to-purple-500 bg-clip-text text-transparent">
            Automatically Ally
          </h2>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ease-out ${
                    isActive
                      ? 'bg-accent/20 text-accent font-medium shadow-[inset_0px_1px_1px_rgba(255,255,255,0.1)]'
                      : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                <Icon size={20} className="drop-shadow-sm" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 mt-auto space-y-2 relative">
          {/* Active Project Selector */}
          <div 
            className="glass dark:glass-dark p-3 rounded-xl flex items-center justify-between border border-border/50 cursor-pointer hover:bg-background/50 transition-colors"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="overflow-hidden">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Current Project</p>
              <p className="text-sm font-semibold truncate text-foreground">{activeProject?.title || 'No Project'}</p>
            </div>
            <ChevronDown size={16} className={`text-muted-foreground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute bottom-28 left-4 right-4 bg-background border border-border/50 rounded-xl shadow-xl overflow-hidden z-20"
              >
                <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                  {projects.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2 text-center">No projects found</p>
                  ) : (
                    projects.map(p => (
                      <div 
                        key={p.id} 
                        className="p-2 rounded-lg hover:bg-muted/50 cursor-pointer flex items-center justify-between transition-colors"
                        onClick={() => { setActiveProject(p); setIsDropdownOpen(false); }}
                      >
                        <span className="text-sm truncate mr-2 text-foreground">{p.title}</span>
                        {activeProject?.id === p.id && <Check size={14} className="text-accent flex-shrink-0" />}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* User Profile */}
          <div className="glass dark:glass-dark p-4 rounded-xl flex items-center space-x-3 mb-2 shadow-sm border border-border/50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-purple-400 flex items-center justify-center text-white font-bold text-lg shadow-inner">
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate text-foreground">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto pt-4 pr-4 pb-4 pl-0 md:pl-4 transition-all duration-500">
        <div className="glass dark:glass-dark rounded-2xl flex-1 shadow-lg overflow-hidden relative flex flex-col">
          {/* Topbar decoration & Universal Back Button */}
          <div className="h-16 border-b border-border/50 flex items-center px-8 bg-background/50 backdrop-blur-md sticky top-0 z-20">
            {location.pathname !== '/dashboard' ? (
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors group"
              >
                <div className="p-1.5 rounded-lg group-hover:bg-accent/10 transition-colors">
                  <ArrowLeft size={20} className="group-hover:text-accent transition-colors" />
                </div>
                <span className="font-medium text-sm">Go Back</span>
              </button>
            ) : (
              <div className="flex-1"></div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-8 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
