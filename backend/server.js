const express = require('express');
const simpleGit = require('simple-git');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const CLONE_DIR = path.join(__dirname, 'cloned_repos');
const sessions = new Map();

// Ensure clone directory exists
async function ensureCloneDir() {
  try {
    await fs.mkdir(CLONE_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating clone directory:', error);
  }
}

// Extract repo info from URL
function parseGitHubUrl(url) {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?$/);
  if (!match) {
    throw new Error('Invalid GitHub URL');
  }
  return { owner: match[1], repo: match[2] };
}

// Get all files recursively
async function getAllFiles(dirPath, baseDir, excludeDirs = ['.git', 'node_modules', '.next', 'dist', 'build']) {
  const files = [];

  async function traverse(currentPath) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relativePath = path.relative(baseDir, fullPath);

      if (entry.isDirectory()) {
        if (!excludeDirs.includes(entry.name)) {
          await traverse(fullPath);
        }
      } else {
        const stats = await fs.stat(fullPath);
        files.push({
          path: relativePath.replace(/\\/g, '/'),
          size: stats.size,
          sizeKB: (stats.size / 1024).toFixed(2)
        });
      }
    }
  }

  await traverse(dirPath);
  return files;
}

// Get all cloned repositories
async function getAllClonedRepos() {
  try {
    // Ensure clone directory exists
    try {
      await fs.access(CLONE_DIR);
    } catch {
      console.log('Clone directory does not exist yet');
      return [];
    }

    const entries = await fs.readdir(CLONE_DIR, { withFileTypes: true });
    const repos = [];

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        try {
          const clonePath = path.join(CLONE_DIR, entry.name);
          const stats = await fs.stat(clonePath);
          
          // Parse sessionId to get repo info
          const parts = entry.name.split('-');
          
          // Need at least owner-repo-timestamp format
          if (parts.length >= 3) {
            // Handle repo names with dashes by joining all parts except last (timestamp)
            const timestamp = parseInt(parts[parts.length - 1]);
            
            // Check if last part is a valid timestamp
            if (!isNaN(timestamp) && timestamp > 1000000000000) {
              const owner = parts[0];
              const repo = parts.slice(1, -1).join('-');
              
              const files = await getAllFiles(clonePath, clonePath);
              
              repos.push({
                sessionId: entry.name,
                owner,
                repo,
                clonedAt: timestamp,
                totalFiles: files.length,
                size: stats.size
              });
              
              console.log(`Found clone: ${owner}/${repo} with ${files.length} files`);
            }
          }
        } catch (err) {
          console.error(`Error processing clone ${entry.name}:`, err);
        }
      }
    }

    console.log(`Total clones found: ${repos.length}`);
    return repos.sort((a, b) => b.clonedAt - a.clonedAt);
  } catch (error) {
    console.error('Error getting cloned repos:', error);
    return [];
  }
}

// Endpoint: Get all cloned repositories
app.get("/api/clones", async (req, res) => {
  try {
    console.log('Fetching all cloned repos...');
    const repos = await getAllClonedRepos();
    console.log(`Returning ${repos.length} clones to frontend`);
    res.json({ repos });
  } catch (error) {
    console.error('Get clones error:', error);
    res.status(500).json({ error: error.message, repos: [] });
  }
});

// Endpoint: Clone repository (NEVER delete)
app.post("/api/clone", async (req, res) => {
  try {
    const { repoUrl } = req.body;

    if (!repoUrl) {
      return res.status(400).json({ error: 'Repository URL is required' });
    }

    const { owner, repo } = parseGitHubUrl(repoUrl);
    const sessionId = `${owner}-${repo}-${Date.now()}`;
    const clonePath = path.join(CLONE_DIR, sessionId);

    console.log(`Cloning ${owner}/${repo} to ${clonePath}`);

    // Clone the repository
    const git = simpleGit();
    await git.clone(repoUrl, clonePath, ['--depth', '1']);

    // Get all files
    const files = await getAllFiles(clonePath, clonePath);

    console.log(`Successfully cloned ${files.length} files`);

    // Store session info (DO NOT DELETE)
    sessions.set(sessionId, {
      clonePath,
      repoUrl,
      owner,
      repo,
      files,
      createdAt: Date.now()
    });

    res.json({
      sessionId,
      owner,
      repo,
      totalFiles: files.length,
      files
    });

  } catch (error) {
    console.error('Clone error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Load existing clone
app.get("/api/clone/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log(`Loading clone: ${sessionId}`);
    const clonePath = path.join(CLONE_DIR, sessionId);

    // Check if clone exists
    try {
      await fs.access(clonePath);
    } catch {
      console.log(`Clone not found: ${sessionId}`);
      return res.status(404).json({ error: 'Clone not found' });
    }

    // Parse sessionId to get repo info
    const parts = sessionId.split('-');
    if (parts.length < 3) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    // Handle repo names with dashes
    const timestamp = parseInt(parts[parts.length - 1]);
    const owner = parts[0];
    const repo = parts.slice(1, -1).join('-');

    console.log(`Parsed: ${owner}/${repo}`);

    // Get all files
    const files = await getAllFiles(clonePath, clonePath);
    console.log(`Found ${files.length} files`);

    // Store/update session info
    sessions.set(sessionId, {
      clonePath,
      owner,
      repo,
      files,
      createdAt: timestamp
    });

    res.json({
      sessionId,
      owner,
      repo,
      totalFiles: files.length,
      files
    });

  } catch (error) {
    console.error('Load clone error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Delete a clone
app.delete("/api/clone/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const clonePath = path.join(CLONE_DIR, sessionId);

    // Delete the clone directory
    await fs.rm(clonePath, { recursive: true, force: true });
    
    // Remove from sessions
    sessions.delete(sessionId);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete clone error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Generate consolidated file (modified to not delete clone)
app.post("/api/generate", async (req, res) => {
  try {
    const { sessionId, selectedFiles } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const clonePath = path.join(CLONE_DIR, sessionId);

    // Check if clone exists
    try {
      await fs.access(clonePath);
    } catch {
      return res.status(404).json({ error: 'Clone not found' });
    }

    // Get session info or parse from sessionId
    let session = sessions.get(sessionId);
    if (!session) {
      const parts = sessionId.split('-');
      if (parts.length < 3) {
        return res.status(400).json({ error: 'Invalid session ID' });
      }
      
      const files = await getAllFiles(clonePath, clonePath);
      session = {
        clonePath,
        owner: parts[0],
        repo: parts[1],
        files,
        createdAt: parseInt(parts[2])
      };
      sessions.set(sessionId, session);
    }

    const { owner, repo } = session;

    // If no files selected, use all files
    const filesToProcess = selectedFiles && selectedFiles.length > 0
      ? selectedFiles
      : session.files.map(f => f.path);

    let consolidatedContent = `# Repository: ${owner}/${repo}\n`;
    consolidatedContent += `# Generated: ${new Date().toISOString()}\n`;
    consolidatedContent += `# Total Files: ${filesToProcess.length}\n\n`;
    consolidatedContent += `${'='.repeat(80)}\n\n`;

    let processedCount = 0;

    for (const filePath of filesToProcess) {
      const fullPath = path.join(clonePath, filePath);

      try {
        const content = await fs.readFile(fullPath, 'utf-8');

        consolidatedContent += `FILE: ${filePath}\n`;
        consolidatedContent += `${'='.repeat(80)}\n\n`;
        consolidatedContent += content;
        consolidatedContent += `\n\n${'='.repeat(80)}\n\n`;

        processedCount++;
      } catch (error) {
        console.log(`Skipping file ${filePath}: ${error.message}`);
      }
    }

    // Don't delete the clone anymore - keep it for reuse

    res.json({
      success: true,
      processedFiles: processedCount,
      content: consolidatedContent,
      filename: `${owner}-${repo}-consolidated.txt`
    });

  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Get file content preview
app.get(/^\/api\/preview\/([^\/]+)\/(.*)/, async (req, res) => {
  try {
    const sessionId = req.params[0];
    const filePath = req.params[1];

    const clonePath = path.join(CLONE_DIR, sessionId);
    const fullPath = path.join(clonePath, filePath);

    const content = await fs.readFile(fullPath, "utf-8");
    const lines = content.split("\n");
    const preview = lines.slice(0, 20).join("\n");

    res.json({
      preview,
      totalLines: lines.length,
      hasMore: lines.length > 20,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: 'ok',
    activeSessions: sessions.size,
    timestamp: new Date().toISOString()
  });
});

// Initialize and start server
async function startServer() {
  await ensureCloneDir();

  app.listen(PORT, () => {
    console.log(`\n🚀 GitHub Repo Consolidator Server`);
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`📁 Clone directory: ${CLONE_DIR}\n`);
  });
}

startServer();