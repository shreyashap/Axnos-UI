# AxnosAI Frontend 🎨

The sleek, intelligent user interface for the **AxnosAI** ecosystem. Built with Next.js 14, this dashboard provides a premium experience for data exploration and analysis.

---

## ✨ Features

- **Interactive AI Chat**: High-performance chat interface with real-time streaming responses.
- **Dynamic Model Selection**: Switch between different LLMs (Mistral, DeepSeek, Llama, GPT) on the fly.
- **Data Visualization**: Integrated code blocks for generated Python/Pandas scripts.
- **File & Database Integration**: Connect to various data sources seamlessly.
- **Voice-to-Text**: Built-in voice recognition for hands-free querying.
- **Premium Design**: Dark-mode first, glassmorphic UI with smooth Framer Motion animations.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 14 (App Router)](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: React Context API
- **Authentication**: JWT-based auth flow

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ 
- NPM / Yarn / Bun

### 2. Configuration
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_AUTH_API_URL=http://localhost:3001
NEXT_PUBLIC_PROXY_API_URL=http://localhost:8001
```

### 3. Installation
```bash
npm install
```

### 4. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

---

## 🐳 Docker Deployment

You can run the frontend as a standalone container or as part of the AxnosAI stack.

### Pull from Docker Hub
```bash
docker pull aakashmohole/axnos-frontend:latest
```

### Run Locally
```bash
docker run -p 3000:3000 aakashmohole/axnos-frontend:latest
```

---

## 📁 Folder Structure

- `app/`: Next.js App Router pages and layouts.
- `components/`: Reusable UI components (ChatArea, SideBar, etc.).
- `context/`: Authentication and Global state providers.
- `lib/`: API service utilities and helper functions.
- `types/`: TypeScript interface definitions.
- `public/`: Static assets and icons.

---

## 📝 License
MIT License. Part of the AxnosAI project.
