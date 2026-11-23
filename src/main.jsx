import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import favicon from './assets/favicon.png'
import './index.css'

// Sekme ikonu (dosyaya gömülü)
const link = document.querySelector("link[rel='icon']") || document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'icon' }))
link.href = favicon

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
