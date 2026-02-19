import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AudioPlayerProvider } from "react-use-audio-player";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AudioPlayerProvider><App /></AudioPlayerProvider>
  </StrictMode>,
)
