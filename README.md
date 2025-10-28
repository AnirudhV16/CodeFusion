# 📦 **CodeFusion — Fusing Code Together**
### Application that clones GitHub repositories locally and consolidates all files into a single text file — perfect for providing complete codebase context to AI models like **ChatGPT**, **Claude**, or **GitHub Copilot**. 

### Easily manage and reuse all your cloned repositories from a **centralized history** for a smoother, more efficient development workflow.
---

📹 Demo

https://github.com/user-attachments/assets/c4beea58-f06e-4394-a4ed-bb481ecd8574

---

📸 Screenshots

<div align="center">
🖥️ Main Interface
<img width="1600" height="855" alt="main interface" src="https://github.com/user-attachments/assets/a4fb9d04-19b5-45e9-8d6e-611c9f42e68b" />

📂 Clone History Sidebar
<img width="1600" height="858" alt="history sidebar" src="https://github.com/user-attachments/assets/fff9ee44-6006-4696-814b-dcfc92d9e334" />

</div>

---

## 🎯 The Problem

Working with AI models often requires providing your entire codebase as context. However:
- ❌ Most LLMs can't directly access GitHub repositories
- ❌ Manual file uploads are tedious and error-prone
- ❌ Uploading files individually loses folder structure
- ❌ GitHub API has strict rate limits

## ✨ The Solution

This tool automatically:
- ✅ Clones entire repositories locally
- ✅ Presents all files in an interactive browser
- ✅ Lets you select specific files to include
- ✅ Generates a single, well-formatted text file
- ✅ Preserves complete folder structure and file paths
- ✅ Maintains history of cloned repositories

---

## 🚀 Features

- **🌐 100% Local Operation** - No cloud services, complete data privacy
- **📂 Clone History** - Reuse previously cloned repositories instantly
- **🔍 Smart File Selection** - Search, filter, and select specific files
- **💾 Persistent Storage** - Cloned repos saved in `backend/cloned_repos/`
- **🎨 Modern UI** - Clean, responsive interface with React + Vite
- **⚡ Fast Performance** - Direct Git cloning, no API overhead

---

## 🛠️ Tech Stack

**Frontend:**
- React 19.1 with Vite
- Lucide React (icons)
- Modern CSS3

**Backend:**
- Node.js + Express
- simple-git (Git operations)
- CORS enabled for local development

---

## 📋 Prerequisites

Ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **npm** (comes with Node.js)

Verify installations:
```bash
node --version
npm --version
git --version
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/AnirudhV16/demo1.git
cd demo1
```

### 2️⃣ Install Backend Dependencies
```bash
cd backend
npm install
```

### 3️⃣ Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 4️⃣ Start the Backend Server
```bash
cd backend
npm start
```
The backend will run on **http://localhost:3000**

### 5️⃣ Start the Frontend (New Terminal)
```bash
cd frontend
npm run dev
```
The frontend will run on **http://localhost:5173**

### 6️⃣ Open Your Browser
Navigate to **http://localhost:5173** to use the application.

---

## 📖 Usage

1. **Enter GitHub URL**: Paste any public repository URL
   ```
   https://github.com/AnirudhV16/CodeFusion.git
   ```

2. **Clone Repository**: Click "Clone Repository" and wait for completion

3. **Select Files**: Browse and select the files you want to consolidate
   - Use search to filter files
   - Select/deselect all with one click

4. **Download**: Click "Download Consolidated File" to generate and download

5. **Manage History**: Access previously cloned repos from the sidebar for instant reuse

---

## 📄 Output Format

The consolidated file is structured like this:

```
# Repository: AnirudhV16/demo1
# Generated: 2025-10-29T10:30:00.000Z
# Total Files: 22

================================================================================
FILE: src/index.js
================================================================================

[Full file content here]

================================================================================
FILE: src/components/Header.jsx
================================================================================

[Full file content here]
```

---

## 📂 Project Structure

```
demo1/
├── backend/
│   ├── cloned_repos/       # Local storage for cloned repositories
│   ├── server.js           # Express server + API routes
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main React component
│   │   ├── App.css         # Application styling
│   │   ├── main.jsx        # React entry point
│   │   └── index.css       # Global styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/clone` | Clone a new repository |
| `GET` | `/api/clone/:sessionId` | Load existing clone |
| `DELETE` | `/api/clone/:sessionId` | Delete a clone |
| `GET` | `/api/clones` | List all cloned repos |
| `POST` | `/api/generate` | Generate consolidated file |
| `GET` | `/api/health` | Health check |

---

## 🐛 Troubleshooting

**Port already in use:**
```bash
# Change backend port in server.js
const PORT = 3001;

# Change frontend port
npm run dev -- --port 3001
```

**Module errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Git not found:**
- Install Git from [git-scm.com](https://git-scm.com/)
- Restart your terminal after installation

---

## 💡 Use Cases

- 🤖 **AI Code Analysis** - Provide complete context to ChatGPT/Claude
- 📚 **Code Reviews** - Consolidate files for comprehensive review
- 🔄 **Project Migration** - Get full codebase overview before refactoring
- 📖 **Documentation** - Generate content for technical documentation
- 🎓 **Learning** - Study open-source project structures

---

## 🔮 Future Enhancements

- [ ] Private repository support (GitHub tokens)
- [ ] Multiple file format exports (JSON, CSV, ZIP)
- [ ] File content preview
- [ ] Syntax highlighting

---

## 🙏 Acknowledgments

- Built with [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- Icons by [Lucide React](https://lucide.dev/)
- Git operations powered by [simple-git](https://www.npmjs.com/package/simple-git)

---

<div align="center">

⭐ Star this repo if you find it helpful!

</div>
