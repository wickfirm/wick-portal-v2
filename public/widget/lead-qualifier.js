/**
 * Wick Lead Qualifier Widget
 * Embeddable AI-powered chat widget for lead qualification
 * Version: 1.0.0
 */

(function() {
  'use strict';

  // Check if already initialized
  if (window.WickLeadQualifierWidget) {
    console.warn('Wick Lead Qualifier Widget already initialized');
    return;
  }

  // Get configuration from global object
  const config = window.WickLeadQualifier || {};
  
  // Default configuration
  const defaultConfig = {
    agencyId: null,
    apiEndpoint: 'https://wick.omnixia.ai/api/lead-qualifier',
    position: 'bottom-right',
    primaryColor: '#3b82f6',
    greeting: 'Hi! How can we help you today?',
    placeholder: 'Type your message...',
    autoOpen: false,
    delayMs: 3000,
    showBranding: true
  };

  // Merge config
  const settings = { ...defaultConfig, ...config };

  // Validate required config
  if (!settings.agencyId) {
    console.error('Wick Lead Qualifier: agencyId is required');
    return;
  }

  // Generate unique visitor ID
  function getVisitorId() {
    let visitorId = localStorage.getItem('wick_visitor_id');
    if (!visitorId) {
      visitorId = 'visitor_' + Math.random().toString(36).substr(2, 9) + Date.now();
      localStorage.setItem('wick_visitor_id', visitorId);
    }
    return visitorId;
  }

  // Get or create conversation ID
  function getConversationId() {
    let conversationId = sessionStorage.getItem('wick_conversation_id');
    if (!conversationId) {
      conversationId = 'conv_' + Math.random().toString(36).substr(2, 9) + Date.now();
      sessionStorage.setItem('wick_conversation_id', conversationId);
    }
    return conversationId;
  }

  const visitorId = getVisitorId();
  const conversationId = getConversationId();
  let messages = [];
  let isOpen = false;
  let isMinimized = false;

  // Create widget HTML
  function createWidget() {
    const positionStyles = settings.position === 'bottom-left' 
      ? 'bottom: 20px; left: 20px;'
      : 'bottom: 20px; right: 20px;';

    const widgetHTML = `
      <div id="wick-lead-qualifier-container" style="position: fixed; ${positionStyles} z-index: 999999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Chat Button -->
        <div id="wick-chat-button" style="
          width: 60px;
          height: 60px;
          border-radius: 30px;
          background: ${settings.primaryColor};
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        ">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>

        <!-- Chat Window -->
        <div id="wick-chat-window" style="
          width: 380px;
          height: 600px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          display: none;
          flex-direction: column;
          overflow: hidden;
          margin-bottom: 10px;
        ">
          <!-- Header -->
          <div style="
            background: ${settings.primaryColor};
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <div>
              <div style="font-weight: 600; font-size: 16px;">Chat with us</div>
              <div style="font-size: 12px; opacity: 0.9;">We typically reply in minutes</div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button id="wick-minimize-btn" style="
                background: rgba(255,255,255,0.2);
                border: none;
                width: 32px;
                height: 32px;
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              <button id="wick-close-btn" style="
                background: rgba(255,255,255,0.2);
                border: none;
                width: 32px;
                height: 32px;
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          <!-- Messages -->
          <div id="wick-messages" style="
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background: #f9fafb;
          ">
            <!-- Messages will be inserted here -->
          </div>

          <!-- Input -->
          <div style="
            border-top: 1px solid #e5e7eb;
            padding: 16px;
            background: white;
          ">
            <form id="wick-message-form" style="display: flex; gap: 8px;">
              <input 
                id="wick-message-input"
                type="text" 
                placeholder="${settings.placeholder}"
                style="
                  flex: 1;
                  padding: 12px;
                  border: 1px solid #e5e7eb;
                  border-radius: 8px;
                  font-size: 14px;
                  outline: none;
                "
              />
              <button type="submit" style="
                background: ${settings.primaryColor};
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                font-size: 14px;
              ">
                Send
              </button>
            </form>
            ${settings.showBranding ? `
              <div style="text-align: center; margin-top: 12px; font-size: 11px; color: #9ca3af;">
                Powered by <a href="https://thewickfirm.com" target="_blank" style="color: ${settings.primaryColor}; text-decoration: none; font-weight: 600;">Wick</a>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHTML);
  }

  // Add greeting message
  function addGreeting() {
    addMessage({
      role: 'assistant',
      content: settings.greeting,
      timestamp: new Date().toISOString()
    });
  }

  // Add message to chat
  function addMessage(message) {
    messages.push(message);
    
    const messagesContainer = document.getElementById('wick-messages');
    const isBot = message.role === 'assistant';
    
    const messageHTML = `
      <div style="
        display: flex;
        justify-content: ${isBot ? 'flex-start' : 'flex-end'};
        margin-bottom: 12px;
      ">
        <div style="
          max-width: 75%;
          padding: 12px 16px;
          border-radius: 12px;
          background: ${isBot ? 'white' : settings.primaryColor};
          color: ${isBot ? '#111827' : 'white'};
          font-size: 14px;
          line-height: 1.5;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        ">
          ${message.content}
        </div>
      </div>
    `;
    
    messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Send message to API
  async function sendMessage(content) {
    try {
      // Add user message to UI
      addMessage({
        role: 'user',
        content: content,
        timestamp: new Date().toISOString()
      });

      // Show typing indicator
      const messagesContainer = document.getElementById('wick-messages');
      const typingHTML = `
        <div id="wick-typing" style="display: flex; gap: 4px; margin-bottom: 12px;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #d1d5db; animation: wick-bounce 1.4s infinite ease-in-out both;"></div>
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #d1d5db; animation: wick-bounce 1.4s infinite ease-in-out 0.16s both;"></div>
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #d1d5db; animation: wick-bounce 1.4s infinite ease-in-out 0.32s both;"></div>
        </div>
      `;
      messagesContainer.insertAdjacentHTML('beforeend', typingHTML);

      // Call API
      const response = await fetch(`${settings.apiEndpoint}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agencyId: settings.agencyId,
          visitorId: visitorId,
          conversationId: conversationId,
          message: content,
          channel: 'website',
          sourceUrl: window.location.href,
          utmParams: getUtmParams()
        })
      });

      // Remove typing indicator
      const typing = document.getElementById('wick-typing');
      if (typing) typing.remove();

      if (response.ok) {
        const data = await response.json();
        
        // Add assistant response
        addMessage({
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Wick Lead Qualifier error:', error);
      
      // Remove typing indicator
      const typing = document.getElementById('wick-typing');
      if (typing) typing.remove();
      
      addMessage({
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get UTM parameters
  function getUtmParams() {
    const params = new URLSearchParams(window.location.search);
    const utm = {};
    
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
      if (params.has(param)) {
        utm[param] = params.get(param);
      }
    });
    
    return Object.keys(utm).length > 0 ? utm : null;
  }

  // Toggle widget
  function toggleWidget() {
    const chatWindow = document.getElementById('wick-chat-window');
    const chatButton = document.getElementById('wick-chat-button');
    
    isOpen = !isOpen;
    
    if (isOpen) {
      chatWindow.style.display = 'flex';
      chatButton.style.display = 'none';
      
      if (messages.length === 0) {
        addGreeting();
      }
    } else {
      chatWindow.style.display = 'none';
      chatButton.style.display = 'flex';
    }
  }

  // Initialize widget
  function init() {
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes wick-bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }
      #wick-chat-button:hover {
        transform: scale(1.05);
      }
    `;
    document.head.appendChild(style);

    // Create widget
    createWidget();

    // Event listeners
    document.getElementById('wick-chat-button').addEventListener('click', toggleWidget);
    document.getElementById('wick-close-btn').addEventListener('click', toggleWidget);
    document.getElementById('wick-minimize-btn').addEventListener('click', toggleWidget);
    
    document.getElementById('wick-message-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('wick-message-input');
      const message = input.value.trim();
      
      if (message) {
        sendMessage(message);
        input.value = '';
      }
    });

    // Auto-open if configured
    if (settings.autoOpen) {
      setTimeout(() => {
        toggleWidget();
      }, settings.delayMs);
    }
  }

  // Public API
  window.WickLeadQualifierWidget = {
    open: function() {
      if (!isOpen) toggleWidget();
    },
    close: function() {
      if (isOpen) toggleWidget();
    },
    toggle: toggleWidget,
    sendMessage: sendMessage,
    on: function(event, callback) {
      // Event listener placeholder
      console.log('Event listener:', event, callback);
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
