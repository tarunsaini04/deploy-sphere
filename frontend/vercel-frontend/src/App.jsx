// src/App.jsx

import { useState, useEffect, useRef } from 'react';
import './App.css'; // Import our new CSS

// Your backend service URLs
const UPLOAD_API_URL = 'http://localhost:3000'; // Upload Service Port
const DEPLOYMENT_PORT = 3001;                   // Request Handler Port

export default function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [deployId, setDeployId] = useState('');
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const logContainerRef = useRef(null);
  
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (message) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleDeploy = async () => {
    if (loading) return;
    setLoading(true);
    setLogs(['Awaiting deployment...']);
    setDeployId('');
    setStatus('uploading');
    setError('');
    addLog('🚀 Starting deployment...');

    try {
      const response = await fetch(`${UPLOAD_API_URL}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: repoUrl }),
      });

      if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);
      
      const { id } = await response.json();
      setDeployId(id);
      addLog(`✅ Upload complete. Project ID: ${id}`);
      addLog(`⏳ Queued for building. Polling for status...`);
      setStatus('queued');
      
      pollStatus(id);

    } catch (err) {
      setError(err.message);
      addLog(`❌ Error: ${err.message}`);
      setStatus('failed');
      setLoading(false);
    }
  };

  const pollStatus = (id) => {
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`${UPLOAD_API_URL}/status?id=${id}`);
        if (!response.ok) return;

        const data = await response.json();
        
        if (data.status === 'building' && status !== 'building') {
          setStatus('building');
          addLog('⚙️ Build in progress...');
        } else if (data.status === 'deployed') {
          setStatus('deployed');
          addLog('✅ Deployment successful!');
          addLog(`🔗 Live site: http://${id}.localhost:${DEPLOYMENT_PORT}`);
          clearInterval(intervalId);
          setLoading(false);
        } else if (data.status === 'failed') {
          setStatus('failed');
          addLog(`❌ Build failed.`);
          setError('The build process failed. Check deploy service logs.');
          clearInterval(intervalId);
          setLoading(false);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);
  };

  return (
    <div className="app-container">
      <div className="card">
        <div className="header">
          <h1>Deploy Your Project</h1>
          <p>Enter a GitHub repository URL to deploy it instantly.</p>
        </div>
        
        <div className="input-group">
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/username/repo-name"
            className="input-field"
            disabled={loading}
          />
          <button
            onClick={handleDeploy}
            className="deploy-button"
            disabled={loading}
          >
            {loading ? 'Deploying...' : 'Deploy'}
          </button>
        </div>

        <div className="status-section">
          <h2>Deployment Status</h2>
          <div ref={logContainerRef} className="logs-container">
            {logs.map((log, index) => <p key={index}>{log}</p>)}
          </div>
          {error && <p className="error-message">Error: {error}</p>}
          {status === 'deployed' && deployId && (
            <div className="success-banner">
              <p>Deployment Complete!</p>
              <a href={`http://${deployId}.localhost:${DEPLOYMENT_PORT}`} target="_blank" rel="noopener noreferrer">
                {`http://${deployId}.localhost:${DEPLOYMENT_PORT}`}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}