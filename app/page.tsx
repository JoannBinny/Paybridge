'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    console.log('[v0] Loading PayBridge app...');
    
    // Dynamically load the React scripts
    const cssLink = document.createElement('link');
    cssLink.href = '/static/css/main.7ce35f97.css';
    cssLink.rel = 'stylesheet';
    cssLink.onload = () => console.log('[v0] CSS loaded');
    cssLink.onerror = () => console.log('[v0] CSS failed to load');
    document.head.appendChild(cssLink);

    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap';
    fontLink.rel = 'stylesheet';
    fontLink.onload = () => console.log('[v0] Fonts loaded');
    fontLink.onerror = () => console.log('[v0] Fonts failed');
    document.head.appendChild(fontLink);

    const script = document.createElement('script');
    script.src = '/static/js/main.fa5f3193.js';
    script.async = true;
    script.onload = () => console.log('[v0] React app script loaded successfully');
    script.onerror = () => console.log('[v0] React app script failed to load');
    document.body.appendChild(script);
    
    console.log('[v0] Script appended to DOM');
  }, []);

  return (
    <div id="root" style={{ width: '100%', height: '100vh', margin: 0, padding: 0 }} />
  );
}
