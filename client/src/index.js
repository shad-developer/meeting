import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global styles
const style = document.createElement('style');
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&display=swap');
  
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  html, body, #root {
    height: 100%;
    width: 100%;
  }

  body {
    background: #080812;
    color: #fff;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  ::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.15);
    border-radius: 2px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.25);
  }

  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0 1000px #1a1a2e inset;
    -webkit-text-fill-color: #fff;
    caret-color: #fff;
  }
`;
document.head.appendChild(style);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
