import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Initialize database on startup
import './lib/database'

createRoot(document.getElementById("root")!).render(<App />);
