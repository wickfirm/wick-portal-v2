'use client';

import { useEffect, useState } from 'react';

export default function WidgetDebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  useEffect(() => {
    addLog('Page loaded');
    
    // Configuration
    addLog('Setting up widget config...');
    (window as any).WickLeadQualifier = {
      agencyId: 'agency-wick',
      apiEndpoint: 'https://wick.omnixia.ai/api/lead-qualifier',
      position: 'bottom-right',
      primaryColor: '#667eea',
      greeting: 'Hi! 👋 Looking to grow your business online? Let\'s chat!',
      placeholder: 'Type your message...',
      autoOpen: false,
      delayMs: 5000
    };
    addLog('Widget config set');
    addLog(`Config: ${JSON.stringify((window as any).WickLeadQualifier)}`);

    // Load widget script
    addLog('Loading widget script...');
    const script = document.createElement('script');
    script.src = '/widget/lead-qualifier.js';
    script.async = true;
    
    script.onload = () => {
      addLog('✅ Widget script loaded successfully');
      setTimeout(() => {
        const container = document.getElementById('wick-lead-qualifier-container');
        if (container) {
          addLog('✅ Widget container found in DOM');
        } else {
          addLog('❌ Widget container NOT found in DOM');
        }
        
        if ((window as any).WickLeadQualifierWidget) {
          addLog('✅ Widget initialized');
        } else {
          addLog('❌ Widget NOT initialized');
        }
      }, 1000);
    };
    
    script.onerror = (error) => {
      addLog(`❌ Failed to load widget script: ${error}`);
    };
    
    document.head.appendChild(script);

    return () => {
      const container = document.getElementById('wick-lead-qualifier-container');
      if (container) container.remove();
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
            Widget Debug Page
          </h1>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            Check the logs below to see if the widget is loading correctly
          </p>
        </div>

        {/* Debug Info */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
            Quick Checks
          </h2>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', fontSize: '14px' }}>
              <strong>1. Can you see the chat bubble?</strong>
              <div style={{ color: '#666', marginTop: '4px' }}>
                Look in the bottom-right corner for a purple circle with chat icon
              </div>
            </div>
            
            <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', fontSize: '14px' }}>
              <strong>2. Open browser console (F12)</strong>
              <div style={{ color: '#666', marginTop: '4px' }}>
                Check for any red errors about the widget
              </div>
            </div>
            
            <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', fontSize: '14px' }}>
              <strong>3. Try hard refresh</strong>
              <div style={{ color: '#666', marginTop: '4px' }}>
                Windows: Ctrl+Shift+R | Mac: Cmd+Shift+R
              </div>
            </div>
            
            <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', fontSize: '14px' }}>
              <strong>4. Disable ad blocker</strong>
              <div style={{ color: '#666', marginTop: '4px' }}>
                Some ad blockers block chat widgets
              </div>
            </div>
          </div>
        </div>

        {/* Logs */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
            Debug Logs
          </h2>
          
          <div style={{ 
            background: '#1a1a1a', 
            color: '#00ff00', 
            padding: '16px', 
            borderRadius: '8px', 
            fontFamily: 'monospace', 
            fontSize: '13px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {logs.length === 0 ? (
              <div style={{ color: '#666' }}>Waiting for logs...</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} style={{ marginBottom: '4px' }}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Test Content */}
        <div style={{ marginTop: '40px', padding: '40px', background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '16px' }}>
            Test Page Content
          </h2>
          <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '16px' }}>
            This is just dummy content to make the page look normal. The chat widget should appear in the bottom-right corner.
          </p>
          <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '16px' }}>
            If you can see the purple chat bubble, click it to open the chat window!
          </p>
          <p style={{ color: '#666', lineHeight: '1.6' }}>
            If you DON'T see it, check the debug logs above and follow the quick checks.
          </p>
        </div>
      </div>
    </div>
  );
}
