import React, { useState, useEffect } from 'react';
import { Download, Github, Loader2, AlertCircle, FileText, Info, CheckSquare, Square, FolderOpen, Trash2, History, X, Clock } from 'lucide-react';
import './App.css';

const API_BASE = 'http://localhost:3000/api';

export default function GitHubRepoConsolidator() {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [repoInfo, setRepoInfo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clonedRepos, setClonedRepos] = useState([]);
  const [loadingClones, setLoadingClones] = useState(false);

  // Load cloned repositories on mount
  useEffect(() => {
    loadClonedRepos();
  }, []);

  const loadClonedRepos = async () => {
    setLoadingClones(true);
    try {
      console.log('Fetching cloned repos from API...');
      const response = await fetch(`${API_BASE}/clones`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Received clones:', data.repos);
        setClonedRepos(data.repos || []);
      } else {
        console.error('Failed to fetch clones:', response.status);
        setClonedRepos([]);
      }
    } catch (err) {
      console.error('Error loading clones:', err);
      setClonedRepos([]);
    } finally {
      setLoadingClones(false);
    }
  };

  const cloneRepository = async () => {
    setError('');
    setProgress('');
    setLoading(true);
    setSessionId(null);
    setFiles([]);
    setSelectedFiles(new Set());
    setRepoInfo(null);

    try {
      setProgress('Cloning repository...');
      
      const response = await fetch(`${API_BASE}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to clone repository');
      }

      const data = await response.json();
      
      setSessionId(data.sessionId);
      setFiles(data.files);
      setRepoInfo({ owner: data.owner, repo: data.repo, totalFiles: data.totalFiles });
      
      // Select all files by default
      const allPaths = new Set(data.files.map(f => f.path));
      setSelectedFiles(allPaths);
      
      setProgress(`✓ Successfully cloned ${data.totalFiles} files!`);
      
      // Refresh cloned repos list
      await loadClonedRepos();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingClone = async (cloneSessionId) => {
    setError('');
    setProgress('');
    setLoading(true);
    setSessionId(null);
    setFiles([]);
    setSelectedFiles(new Set());
    setRepoInfo(null);

    try {
      console.log('Loading clone:', cloneSessionId);
      setProgress('Loading repository...');
      
      const response = await fetch(`${API_BASE}/clone/${cloneSessionId}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load repository');
      }

      const data = await response.json();
      console.log('Loaded clone data:', data);
      
      setSessionId(data.sessionId);
      setFiles(data.files);
      setRepoInfo({ owner: data.owner, repo: data.repo, totalFiles: data.totalFiles });
      
      // Select all files by default
      const allPaths = new Set(data.files.map(f => f.path));
      setSelectedFiles(allPaths);
      
      setProgress(`✓ Successfully loaded ${data.totalFiles} files!`);
      setSidebarOpen(false);
    } catch (err) {
      console.error('Error loading clone:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteClone = async (cloneSessionId, e) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this cloned repository?')) {
      return;
    }

    setError('');
    
    try {
      const response = await fetch(`${API_BASE}/clone/${cloneSessionId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete clone');
      }

      console.log(`Deleted clone: ${cloneSessionId}`);
      
      // Refresh cloned repos list immediately
      await loadClonedRepos();
      
      // If the deleted clone was currently loaded, clear it
      if (sessionId === cloneSessionId) {
        setSessionId(null);
        setFiles([]);
        setSelectedFiles(new Set());
        setRepoInfo(null);
        setProgress('');
        console.log('Cleared currently loaded clone from UI');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message);
    }
  };

  const generateConsolidatedFile = async () => {
    if (!sessionId) return;

    setError('');
    setLoading(true);
    setProgress('Generating consolidated file...');

    try {
      const response = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          selectedFiles: Array.from(selectedFiles)
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate file');
      }

      const data = await response.json();
      
      // Download the file
      const blob = new Blob([data.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setProgress(`✓ Successfully consolidated ${data.processedFiles} files!`);
      
      // *** IMPORTANT: Refresh sidebar to show the clone is still there ***
      await loadClonedRepos();
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleFile = (filePath) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(filePath)) {
      newSelected.delete(filePath);
    } else {
      newSelected.add(filePath);
    }
    setSelectedFiles(newSelected);
  };

  const toggleAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.path)));
    }
  };

  const filteredFiles = files.filter(file => 
    file.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatSize = (sizeKB) => {
    const kb = parseFloat(sizeKB);
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  return (
    <div className="app">
      {/* Sidebar Toggle Button */}
      <button 
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        title="View Clone History"
      >
        <History size={24} />
        {/*{clonedRepos.length > 0 && (
          <span className="badge">{clonedRepos.length}</span>
        )}*/}
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">
            <History size={20} />
            <h2>Clone History</h2>
          </div>
          <div className="sidebar-header-actions">
            <button 
              className="sidebar-refresh"
              onClick={(e) => {
                e.stopPropagation();
                loadClonedRepos();
              }}
              title="Refresh list"
            >
              <Loader2 size={16} className={loadingClones ? 'spinner' : ''} />
            </button>
            <button 
              className="sidebar-close"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="sidebar-content">
          {loadingClones ? (
            <div className="sidebar-loading">
              <Loader2 className="spinner" size={32} />
              <p>Loading clones...</p>
            </div>
          ) : clonedRepos.length === 0 ? (
            <div className="sidebar-empty">
              <FolderOpen size={48} opacity={0.3} />
              <p>No cloned repositories yet</p>
              <small>Clone a repository to see it here</small>
            </div>
          ) : (
            <div className="sidebar-list">
              {clonedRepos.map((repo) => (
                <div 
                  key={repo.sessionId}
                  className={`sidebar-item ${sessionId === repo.sessionId ? 'active' : ''}`}
                  onClick={() => loadExistingClone(repo.sessionId)}
                >
                  <div className="sidebar-item-header">
                    <Github size={16} />
                    <span className="sidebar-item-title">
                      {repo.owner}/{repo.repo}
                    </span>
                  </div>
                  <div className="sidebar-item-details">
                    <div className="sidebar-item-info">
                      <Clock size={12} />
                      <small>{formatDate(repo.clonedAt)}</small>
                    </div>
                    <small className="sidebar-item-files">
                      {repo.totalFiles} files
                    </small>
                  </div>
                  <button
                    className="sidebar-item-delete"
                    onClick={(e) => deleteClone(repo.sessionId, e)}
                    title="Delete clone"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="container">
        <header className="header">
          <div className="header-content">
            <Github className="header-icon" />
            <h1>GitHub Repo Consolidator</h1>
          </div>
          <p className="header-subtitle">
            Clone, select, and consolidate repository files locally
          </p>
        </header>

        <div className="main-card">
          <div className="form-group">
            <label className="form-label">GitHub Repository URL</label>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repository"
              disabled={loading}
              className="form-input"
            />
            <p className="form-help">
              Public repositories only. Previously cloned repos are saved in history.
            </p>
          </div>

          {!sessionId ? (
            <button
              onClick={cloneRepository}
              disabled={!repoUrl || loading}
              className="submit-button"
            >
              {loading ? (
                <>
                  <Loader2 className="button-icon spinner" />
                  Cloning Repository...
                </>
              ) : (
                <>
                  <FolderOpen className="button-icon" />
                  Clone Repository
                </>
              )}
            </button>
          ) : (
            <button
              onClick={generateConsolidatedFile}
              disabled={selectedFiles.size === 0 || loading}
              className="submit-button generate-button"
            >
              {loading ? (
                <>
                  <Loader2 className="button-icon spinner" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="button-icon" />
                  Download Consolidated File ({selectedFiles.size} files)
                </>
              )}
            </button>
          )}

          {progress && (
            <div className="progress-box">
              <div className="progress-content">
                <FileText className="progress-icon" />
                <p className="progress-text">{progress}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="error-box">
              <div className="error-content">
                <AlertCircle className="error-icon" />
                <div>
                  <p className="error-title">Error</p>
                  <p className="error-message">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {sessionId && repoInfo && (
          <div className="files-card">
            <div className="files-header">
              <h2 className="files-title">
                Repository: {repoInfo.owner}/{repoInfo.repo}
              </h2>
              <p className="files-stats">
                Total files: {repoInfo.totalFiles} | Selected: {selectedFiles.size}
              </p>
            </div>

            <div className="search-box">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search files..."
                className="search-input"
              />
            </div>

            <div className="select-all-box">
              <button onClick={toggleAll} className="select-all-button">
                {selectedFiles.size === files.length ? (
                  <>
                    <Square className="select-icon" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <CheckSquare className="select-icon" />
                    Select All
                  </>
                )}
              </button>
            </div>

            <div className="files-list">
              {filteredFiles.map((file) => (
                <div
                  key={file.path}
                  onClick={() => toggleFile(file.path)}
                  className={`file-item ${selectedFiles.has(file.path) ? 'selected' : ''}`}
                >
                  {selectedFiles.has(file.path) ? (
                    <CheckSquare className="file-checkbox selected" />
                  ) : (
                    <Square className="file-checkbox" />
                  )}
                  <div className="file-info">
                    <p className="file-path">{file.path}</p>
                    <p className="file-size">{formatSize(file.sizeKB)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="info-card">
          <h2 className="info-header">
            <Info className="info-icon" />
            How it works
          </h2>
          <ul className="info-list">
            <li>
              <span className="bullet">•</span>
              <span>Backend clones the repository locally (no API rate limits)</span>
            </li>
            <li>
              <span className="bullet">•</span>
              <span>Cloned repos are saved and can be reused from the history sidebar</span>
            </li>
            <li>
              <span className="bullet">•</span>
              <span>Select which files you want to include in the output</span>
            </li>
            <li>
              <span className="bullet">•</span>
              <span>Download a single consolidated text file with all selected content</span>
            </li>
            <li>
              <span className="bullet">•</span>
              <span>Manage your cloned repos - delete them when no longer needed</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
