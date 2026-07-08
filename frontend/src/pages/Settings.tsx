import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { User, Bell, Shield, Moon, Sun, Users, Crown, Check, X as CloseIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';

const Settings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { activeProject } = useProject();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'team' | 'admin'>('profile');
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [notifications, setNotifications] = useState(true);

  const [inviteEmail, setInviteEmail] = useState('');
  const [adminRequests, setAdminRequests] = useState<any[]>([]);
  const [generatedLink, setGeneratedLink] = useState('');
  const [projectMembers, setProjectMembers] = useState<any[]>([]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const fetchAdminRequests = async () => {
    try {
      if (user?.role === 'Admin') {
        const res = await api.get('/auth/admin-requests');
        setAdminRequests(res.data);
      }
    } catch (e) {
      console.error("Failed to fetch admin requests");
    }
  };

  const fetchProjectMembers = async () => {
    try {
      if (activeProject) {
        const res = await api.get(`/projects/${activeProject.id}/members`);
        setProjectMembers(res.data);
      }
    } catch (e) {
      console.error("Failed to fetch project members");
    }
  };

  useEffect(() => {
    if (activeTab === 'admin') {
      fetchAdminRequests();
    }
    if (activeTab === 'team') {
      fetchProjectMembers();
    }
  }, [activeTab, user, activeProject]);

  const handleRequestAdmin = async () => {
    try {
      const res = await api.post('/auth/request-admin');
      alert(res.data.message);
      await refreshUser();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error requesting admin.");
    }
  };

  const handleApproveAdmin = async (id: number) => {
    try {
      const res = await api.put(`/auth/approve-admin/${id}`);
      alert(res.data.message);
      await refreshUser();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error approving request.");
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/invites/', { email: inviteEmail });
      setGeneratedLink(`http://localhost:5173/register?invite_token=${res.data.token}`);
      setInviteEmail('');
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error sending invite.");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your account preferences and application settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-8">
        {/* Settings Navigation */}
        <div className="space-y-2 md:col-span-1">
          <div onClick={() => setActiveTab('profile')} className={`p-3 rounded-xl flex items-center space-x-3 font-medium cursor-pointer transition-colors ${activeTab === 'profile' ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}>
            <User size={18} /><span>Profile</span>
          </div>
          <div onClick={() => setActiveTab('team')} className={`p-3 rounded-xl flex items-center space-x-3 font-medium cursor-pointer transition-colors ${activeTab === 'team' ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}>
            <Users size={18} /><span>Team</span>
          </div>
          <div onClick={() => setActiveTab('security')} className={`p-3 rounded-xl flex items-center space-x-3 font-medium cursor-pointer transition-colors ${activeTab === 'security' ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}>
            <Shield size={18} /><span>Security</span>
          </div>
          <div onClick={() => setActiveTab('notifications')} className={`p-3 rounded-xl flex items-center space-x-3 font-medium cursor-pointer transition-colors ${activeTab === 'notifications' ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}>
            <Bell size={18} /><span>Notifications</span>
          </div>
          <div onClick={() => setActiveTab('admin')} className={`p-3 rounded-xl flex items-center space-x-3 font-medium cursor-pointer transition-colors ${activeTab === 'admin' ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}>
            <Crown size={18} /><span>Administration</span>
          </div>
        </div>

        {/* Settings Content */}
        <div className="md:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass dark:glass-dark p-6 rounded-2xl border border-border/50">
                <h2 className="text-lg font-semibold text-foreground mb-4">Profile Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground/80">Full Name</label>
                    <input disabled value={user?.full_name || ''} className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 outline-none opacity-70 cursor-not-allowed mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground/80">Email Address</label>
                    <input disabled value={user?.email || ''} className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 outline-none opacity-70 cursor-not-allowed mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground/80">Role</label>
                    <input disabled value={user?.role || ''} className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 outline-none opacity-70 cursor-not-allowed mt-1 capitalize" />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'team' && (
              <motion.div key="team" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass dark:glass-dark p-6 rounded-2xl border border-border/50">
                <h2 className="text-lg font-semibold text-foreground mb-4">Project Members</h2>
                <p className="text-sm text-muted-foreground mb-4">People who have access to the current active project: <span className="font-semibold text-foreground">{activeProject?.title}</span></p>
                
                <div className="space-y-3 mb-8 max-w-xl">
                  {projectMembers.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-background/50 rounded-xl border border-border/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-sm">
                          {member.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{member.full_name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 bg-muted rounded-md capitalize">{member.role}</span>
                    </div>
                  ))}
                  {projectMembers.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No members found.</p>
                  )}
                </div>

                <div className="border-t border-border/50 pt-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Invite New Members</h2>
                  <p className="text-sm text-muted-foreground mb-6">Generate an invite link to send to your colleagues.</p>
                  
                  <form onSubmit={handleSendInvite} className="space-y-4 max-w-sm">
                    <div>
                      <label className="text-sm font-medium text-foreground/80">Email Address</label>
                      <input type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 outline-none focus:border-accent mt-1" placeholder="colleague@university.edu" />
                    </div>
                    <button type="submit" className="bg-accent hover:bg-accent/90 text-white px-6 py-2 rounded-xl transition-colors mt-2">
                      Generate Invite Link
                    </button>
                  </form>
                </div>

                {generatedLink && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded-xl max-w-sm">
                    <p className="text-sm font-medium text-accent mb-2">Invite Link Generated Successfully!</p>
                    <p className="text-xs text-muted-foreground mb-2">Share this real-time link with your colleague to grant them access:</p>
                    <div className="flex items-center space-x-2">
                      <input readOnly value={generatedLink} className="flex-1 bg-background/50 border border-border/50 rounded-lg px-3 py-2 text-sm outline-none text-foreground" />
                      <button onClick={() => { navigator.clipboard.writeText(generatedLink); alert("Copied to clipboard!"); }} className="bg-accent text-white px-3 py-2 rounded-lg text-sm hover:bg-accent/90 transition-colors">
                        Copy
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div key="security" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass dark:glass-dark p-6 rounded-2xl border border-border/50">
                <h2 className="text-lg font-semibold text-foreground mb-4">Security Settings</h2>
                <p className="text-sm text-muted-foreground mb-4">Update your password to keep your account secure.</p>
                
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const current = (form.elements.namedItem('current_password') as HTMLInputElement).value;
                    const newPass = (form.elements.namedItem('new_password') as HTMLInputElement).value;
                    
                    try {
                      await api.put('/auth/password', { current_password: current, new_password: newPass });
                      alert("Password updated successfully!");
                      form.reset();
                    } catch (err: any) {
                      alert(err.response?.data?.detail || "Failed to update password");
                    }
                  }}
                  className="space-y-4 max-w-sm"
                >
                  <div>
                    <label className="text-sm font-medium text-foreground/80">Current Password</label>
                    <input type="password" name="current_password" required className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 outline-none focus:border-accent mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground/80">New Password</label>
                    <input type="password" name="new_password" required minLength={6} className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 outline-none focus:border-accent mt-1" />
                  </div>
                  <button type="submit" className="bg-accent hover:bg-accent/90 text-white px-6 py-2 rounded-xl transition-colors mt-2">
                    Update Password
                  </button>
                </form>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass dark:glass-dark p-6 rounded-2xl border border-border/50">
                <h2 className="text-lg font-semibold text-foreground mb-4">Preferences</h2>
                
                <div className="flex items-center justify-between py-3 border-b border-border/50">
                  <div>
                    <p className="font-medium text-foreground">Theme</p>
                    <p className="text-sm text-muted-foreground">Switch between light and dark mode</p>
                  </div>
                  <button 
                    onClick={() => setDarkMode(!darkMode)}
                    className={`w-14 h-8 rounded-full flex items-center transition-colors p-1 ${darkMode ? 'bg-accent' : 'bg-muted'}`}
                  >
                    <motion.div layout className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm" initial={false} animate={{ x: darkMode ? 24 : 0 }}>
                      {darkMode ? <Moon size={14} className="text-accent" /> : <Sun size={14} className="text-muted-foreground" />}
                    </motion.div>
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'admin' && (
              <motion.div key="admin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass dark:glass-dark p-6 rounded-2xl border border-border/50">
                <h2 className="text-lg font-semibold text-foreground mb-4">Administration</h2>
                
                {user?.role === 'Admin' ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-6">You are the current workspace Admin. Below are pending requests from users wishing to take over the Admin role.</p>
                    
                    {adminRequests.length === 0 ? (
                      <div className="p-4 bg-background/50 rounded-xl border border-border/50 text-center text-muted-foreground text-sm">
                        No pending admin transfer requests.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {adminRequests.map((req) => (
                          <div key={req.id} className="flex items-center justify-between p-4 bg-background/50 rounded-xl border border-border/50">
                            <div>
                              <p className="font-semibold text-foreground">{req.requester.full_name}</p>
                              <p className="text-xs text-muted-foreground">{req.requester.email}</p>
                            </div>
                            <button 
                              onClick={() => handleApproveAdmin(req.id)}
                              className="bg-accent/10 hover:bg-accent/20 text-accent px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                            >
                              Approve & Swap Roles
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground mb-6">
                      The workspace can only have one primary Admin. If there is no Admin, you can claim the role instantly. If there is an Admin, you will submit a role swap request to them.
                    </p>
                    <button 
                      onClick={handleRequestAdmin}
                      className="bg-accent hover:bg-accent/90 text-white px-6 py-2.5 rounded-xl transition-colors font-medium flex items-center space-x-2"
                    >
                      <Crown size={18} />
                      <span>Request Admin Privileges</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Settings;
