import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, UploadCloud, CheckCircle, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { useProject } from '../context/ProjectContext';

interface Paper {
  id: number;
  title: string;
  status: 'pending' | 'scanning' | 'completed' | 'failed';
  summary?: string;
  created_at: string;
}

const Papers: React.FC = () => {
  const { activeProject } = useProject();
  const projectId = activeProject?.id;
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedPapers, setSelectedPapers] = useState<number[]>([]);

  // 2. Poll papers for the active project
  useEffect(() => {
    if (!projectId) {
      setPapers([]);
      return;
    }

    const fetchPapers = async () => {
      try {
        const res = await api.get(`/projects/${projectId}/papers/`);
        setPapers(res.data);
      } catch (err) {
        console.error("Failed to fetch papers", err);
      }
    };

    fetchPapers();
    const interval = setInterval(fetchPapers, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [projectId]);

  // 3. Handle Drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!projectId) return;
    if (acceptedFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadError(null);
    
    const formData = new FormData();
    // Enforce max 30 files in frontend
    const filesToUpload = acceptedFiles.slice(0, 30);
    filesToUpload.forEach(file => formData.append('files', file));

    try {
      await api.post(`/projects/${projectId}/papers/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Will auto-refresh via polling
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, [projectId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 30,
    maxSize: 10485760 // 10MB
  });

  const [viewingPaper, setViewingPaper] = useState<Paper | null>(null);

  const handleDeleteSelected = async () => {
    if (!projectId || selectedPapers.length === 0) return;
    try {
      await api.post(`/projects/${projectId}/papers/bulk-delete`, { paper_ids: selectedPapers });
      setSelectedPapers([]);
      // Let the polling refresh the list or manually filter
      setPapers(prev => prev.filter(p => !selectedPapers.includes(p.id)));
    } catch (err) {
      alert("Failed to delete selected papers.");
    }
  };

  const toggleSelect = (e: React.MouseEvent, paperId: number) => {
    e.stopPropagation();
    setSelectedPapers(prev => 
      prev.includes(paperId) ? prev.filter(id => id !== paperId) : [...prev, paperId]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="text-green-500" size={18} />;
      case 'scanning': return <Loader2 className="animate-spin text-accent" size={18} />;
      case 'failed': return <AlertCircle className="text-destructive" size={18} />;
      default: return <Loader2 className="animate-spin text-muted-foreground" size={18} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Papers & Literature</h1>
          <p className="text-muted-foreground text-sm">Upload up to 30 PDFs to automatically generate AI summaries.</p>
        </div>
      </div>

      {uploadError && (
        <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20">
          {uploadError}
        </div>
      )}

      {/* Upload Zone */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors
          ${isDragActive ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50 hover:bg-background/50'}`}
      >
        <input {...getInputProps()} />
        <UploadCloud className={`mb-4 ${isDragActive ? 'text-accent' : 'text-muted-foreground'}`} size={48} />
        {isUploading ? (
          <p className="text-lg font-medium text-foreground">Uploading files...</p>
        ) : isDragActive ? (
          <p className="text-lg font-medium text-accent">Drop the PDFs here ...</p>
        ) : (
          <>
            <p className="text-lg font-medium text-foreground mb-1">Drag & drop your PDFs here</p>
            <p className="text-sm text-muted-foreground">or click to browse files (Max 30 files, 10MB each)</p>
          </>
        )}
      </div>

      {/* Main Content Area: Papers List & Viewer */}
      {viewingPaper ? (
        <div className="flex flex-col md:flex-row gap-6 mt-8 h-[70vh]">
          {/* Summary Sidebar */}
          <div className="w-full md:w-1/3 glass dark:glass-dark p-6 rounded-2xl border border-border/50 flex flex-col h-full overflow-y-auto">
            <button 
              onClick={() => setViewingPaper(null)}
              className="text-sm text-accent hover:underline mb-4 self-start"
            >
              &larr; Back to List
            </button>
            <h2 className="text-xl font-bold text-foreground mb-4">{viewingPaper.title}</h2>
            <div className="flex items-center space-x-2 mb-6">
              {getStatusIcon(viewingPaper.status)}
              <span className="text-sm text-muted-foreground capitalize">{viewingPaper.status}</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground/90 mb-2">AI Generated Summary</h3>
              <div className="p-4 bg-background/50 rounded-xl border border-border/50 text-sm text-foreground/90 leading-relaxed shadow-inner">
                {viewingPaper.summary || "Summary not available yet."}
              </div>
            </div>
          </div>
          
          {/* PDF Viewer */}
          <div className="w-full md:w-2/3 glass dark:glass-dark rounded-2xl border border-border/50 h-full overflow-hidden flex flex-col">
            <div className="bg-muted/30 p-3 border-b border-border/50 flex justify-between items-center">
              <span className="text-sm font-medium">PDF Viewer</span>
            </div>
            <object 
              data={`http://${window.location.hostname}:8000/projects/${projectId}/papers/${viewingPaper.id}/download`} 
              type="application/pdf" 
              className="w-full h-full"
            >
              <div className="flex items-center justify-center h-full flex-col space-y-4">
                <p>Unable to display PDF in this browser.</p>
                <a href={`http://${window.location.hostname}:8000/projects/${projectId}/papers/${viewingPaper.id}/download`} target="_blank" className="text-accent hover:underline">
                  Download PDF directly
                </a>
              </div>
            </object>
          </div>
        </div>
      ) : (
        <div className="space-y-4 mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Processing Queue & Summaries</h2>
            {selectedPapers.length > 0 && (
              <button 
                onClick={handleDeleteSelected}
                className="flex items-center space-x-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white px-4 py-2 rounded-xl transition-colors text-sm font-medium shadow-sm"
              >
                <Trash2 size={16} />
                <span>Delete Selected ({selectedPapers.length})</span>
              </button>
            )}
          </div>
          
          {papers.length === 0 && (
            <p className="text-muted-foreground text-sm italic">No papers uploaded yet.</p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {papers.map(paper => (
              <motion.div 
                key={paper.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative glass dark:glass-dark p-5 rounded-2xl border flex flex-col justify-between hover:shadow-lg transition-shadow cursor-pointer ${
                  selectedPapers.includes(paper.id) ? 'border-destructive bg-destructive/5' : 'border-border/50'
                }`}
                onClick={() => paper.status === 'completed' && setViewingPaper(paper)}
              >
                {/* Selection Checkbox */}
                <div 
                  className="absolute top-4 right-4 z-10"
                  onClick={(e) => toggleSelect(e, paper.id)}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    selectedPapers.includes(paper.id) ? 'bg-destructive border-destructive text-white' : 'border-muted-foreground/50 hover:border-foreground bg-background/50'
                  }`}>
                    {selectedPapers.includes(paper.id) && <CheckCircle size={14} className="text-white" />}
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-3 mb-4 pr-6">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <FileText className="text-accent" size={24} />
                    </div>
                    <div className="flex-1 truncate">
                      <h3 className="font-medium text-foreground truncate" title={paper.title}>{paper.title}</h3>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusIcon(paper.status)}
                    <span className="text-xs text-muted-foreground capitalize">{paper.status}</span>
                  </div>
                </div>
                
                {paper.status === 'completed' && (
                  <button 
                    className="mt-4 w-full bg-accent/10 hover:bg-accent/20 text-accent font-medium py-2 rounded-xl transition-colors text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingPaper(paper);
                    }}
                  >
                    Read Paper & Summary
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Papers;
