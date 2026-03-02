// ==================================
// UNIVERSAL HUMAN ASSISTANT - CHAT.JS
// Susstyle UHA System - Frontend Logic
// ==================================

const API_URL = '/api/chat'; // Vercel serverless function endpoint
const messagesContainer = document.getElementById('messages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const agentLabel = document.getElementById('agentLabel');
const welcomeScreen = document.getElementById('welcomeScreen');

let currentAgent = 'master';
let conversationId = getOrCreateConversationId();
let userId = getOrCreateUserId();
let messageHistory = [];

// ==================================
// AGENT DEFINITIONS
// ==================================

const AGENT_ICONS = {
  'master': '\ud83e\udd16',
  'c209-logistics': '\ud83d\udce6',
  'fashion-advisor': '\ud83d\udc57',
  'mental-health': '\ud83d\udc9a',
  'education': '\ud83d\udcda',
  'legal': '\u2696\ufe0f',
  'career': '\ud83d\udcbc'
};

const AGENT_NAMES = {
  'master': 'Master Agent',
  'c209-logistics': 'Ekspert C209',
  'fashion-advisor': 'Doradca Eko-Mody',
  'mental-health': 'Asystent Zdrowia',
  'education': 'Tutor Edukacyjny',
  'legal': 'Doradca Prawny',
  'career': 'Coach Kariery'
};

// ==================================
// INITIALIZATION
// ==================================

function init() {
  loadConversationHistory();
  
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  chatInput.addEventListener('input', autoResizeTextarea);
}

function autoResizeTextarea() {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
}

// ==================================
// MESSAGE HANDLING
// ==================================

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || sendBtn.disabled) return;

  // Hide welcome screen
  if (welcomeScreen) welcomeScreen.style.display = 'none';

  // Add user message to UI
  addMessage('user', text);
  messageHistory.push({ role: 'user', content: text });
  chatInput.value = '';
  autoResizeTextarea();

  // Disable input
  sendBtn.disabled = true;
  chatInput.disabled = true;

  // Show typing indicator
  const typingId = showTypingIndicator();

  try {
    // Call API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        conversationId,
        userId,
        history: messageHistory.slice(-10) // ostatnie 10 wiadomosci
      })
    });

    if (!response.ok) throw new Error('API Error');

    const data = await response.json();
    
    // Remove typing indicator
    removeTypingIndicator(typingId);

    // Update agent if changed
    if (data.agent && data.agent !== currentAgent) {
      currentAgent = data.agent;
      updateAgentBadge(data.agent);
    }

    // Add assistant response
    addMessage('bot', data.response, data.agent);
    messageHistory.push({ role: 'assistant', content: data.response, agent: data.agent });

    // Save to localStorage
    saveConversationHistory();

  } catch (error) {
    console.error('Chat error:', error);
    removeTypingIndicator(typingId);
    
    // MOCK RESPONSE for testing (usuniete po wdrozeniu API)
    const mockResponse = getMockResponse(text);
    addMessage('bot', mockResponse.text, mockResponse.agent);
    messageHistory.push({ role: 'assistant', content: mockResponse.text });
    
    if (mockResponse.agent !== currentAgent) {
      currentAgent = mockResponse.agent;
      updateAgentBadge(mockResponse.agent);
    }
  } finally {
    // Re-enable input
    sendBtn.disabled = false;
    chatInput.disabled = false;
    chatInput.focus();
  }
}

function addMessage(role, content, agent = null) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `msg ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = role === 'bot' ? (AGENT_ICONS[agent] || AGENT_ICONS.master) : '\ud83d\udc64';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.textContent = content;

  if (role === 'bot' && agent && agent !== 'master') {
    const agentTag = document.createElement('div');
    agentTag.className = 'msg-agent-tag';
    agentTag.textContent = `${AGENT_NAMES[agent] || agent}`;
    bubble.appendChild(agentTag);
  }

  msgDiv.appendChild(avatar);
  msgDiv.appendChild(bubble);
  messagesContainer.appendChild(msgDiv);

  // Scroll to bottom
  setTimeout(() => {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, 100);
}

function showTypingIndicator() {
  const id = 'typing-' + Date.now();
  const msgDiv = document.createElement('div');
  msgDiv.className = 'msg bot';
  msgDiv.id = id;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = AGENT_ICONS[currentAgent];

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  const typing = document.createElement('div');
  typing.className = 'typing-indicator';
  typing.innerHTML = '<span></span><span></span><span></span>';
  bubble.appendChild(typing);

  msgDiv.appendChild(avatar);
  msgDiv.appendChild(bubble);
  messagesContainer.appendChild(msgDiv);

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  return id;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function updateAgentBadge(agent) {
  agentLabel.textContent = `${AGENT_ICONS[agent]} ${AGENT_NAMES[agent]} aktywny`;
}

// ==================================
// QUICK ACTIONS
// ==================================

function quickSend(text) {
  chatInput.value = text;
  sendMessage();
}

// ==================================
// LOCAL STORAGE PERSISTENCE
// ==================================

function getOrCreateConversationId() {
  let id = sessionStorage.getItem('uha_conversation_id');
  if (!id) {
    id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('uha_conversation_id', id);
  }
  return id;
}

function getOrCreateUserId() {
  let id = localStorage.getItem('uha_user_id');
  if (!id) {
    id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('uha_user_id', id);
  }
  return id;
}

function saveConversationHistory() {
  try {
    localStorage.setItem(`uha_history_${conversationId}`, JSON.stringify(messageHistory));
  } catch (e) {
    console.warn('Failed to save history:', e);
  }
}

function loadConversationHistory() {
  try {
    const saved = localStorage.getItem(`uha_history_${conversationId}`);
    if (saved) {
      messageHistory = JSON.parse(saved);
      
      if (messageHistory.length > 0) {
        if (welcomeScreen) welcomeScreen.style.display = 'none';
        messageHistory.forEach(msg => {
          addMessage(msg.role, msg.content, msg.agent);
        });
      }
    }
  } catch (e) {
    console.warn('Failed to load history:', e);
  }
}

// ==================================
// MOCK RESPONSES (for testing)
// Usuniete po wdrozeniu prawdziwego API
// ==================================

function getMockResponse(userMessage) {
  const msg = userMessage.toLowerCase();

  // C209 / Logistics
  if (msg.includes('c209') || msg.includes('formularz') || msg.includes('clo') || msg.includes('logistyk')) {
    return {
      agent: 'c209-logistics',
      text: 'Witaj! Jestem ekspertem od formularzy C209 i logistyki celnej.\n\nFormularz C209 sluzy do deklaracji towarow w procedurze in-bond. Potrzebuje kilku informacji:\n\n1. Wartosc towaru w EUR\n2. Stawka cla (%)\n3. Stawka VAT (%)\n4. Koszt transportu\n\nMoge pomoc Ci obliczyc naleznosci celne lub wypelnic formularz krok po kroku. Co Cie interesuje?'
    };
  }

  // Fashion / Eko-moda
  if (msg.includes('moda') || msg.includes('ubrania') || msg.includes('eko') || msg.includes('sustainable')) {
    return {
      agent: 'fashion-advisor',
      text: 'Czesc! Jestem Twoim doradca zrownowazonej mody.\n\nPomoge Ci wybrac eko-friendly ubrania, znalezc sustainable marki i zbudowac swiadoma szafe.\n\nCzy szukasz:\n- Konkretnych marek sustainable?\n- Porad jak budowac eko-szafe?\n- Informacji o materialach przyjaznych srodowisku?\n\nCo Cie interesuje najbardziej?'
    };
  }

  // Mental health
  if (msg.includes('wsparcie') || msg.includes('psychiczne') || msg.includes('stres') || msg.includes('lekowy')) {
    return {
      agent: 'mental-health',
      text: 'Witam. Jestem asystentem wsparcia zdrowia psychicznego.\n\nPamietaj: nie jestem terapeuta ani lekarzem, ale moge:\n- Zaproponowac techniki relaksacyjne\n- Pomoc w organizacji myslenia\n- Skierowac do profesjonalnej pomocy\n\nJesli masz mysli samobojcze lub powaznie cierpisz, dzwon 116 123 (Telefon Zaufania) lub 112.\n\nJak moge Ci dzis pomoc?'
    };
  }

  // Education
  if (msg.includes('nauka') || msg.includes('uczenie') || msg.includes('edukacja') || msg.includes('kurs')) {
    return {
      agent: 'education',
      text: 'Czesc! Jestem Twoim tutorem edukacyjnym.\n\nMoge pomoc Ci w:\n- Nauce nowych umiejetnosci\n- Wyjasnieni trudnych koncepcji\n- Rekomendacjach zasobow edukacyjnych\n- Motywacji do nauki\n\nCzego chcialbys sie nauczyc? Jaki jest Twoj cel?'
    };
  }

  // General / Master
  return {
    agent: 'master',
    text: 'Rozumiem. Moge pomoc Ci w roznych dziedzinach:\n\n\ud83d\udce6 Logistyka i formularze C209\n\ud83d\udc57 Zrownowazona moda\n\ud83d\udc9a Zdrowie psychiczne\n\ud83d\udcda Edukacja i rozwoj\n\u2696\ufe0f Informacje prawne\n\ud83d\udcbc Kariera i CV\n\nCzy moglbys sprecyzowac, w czym dokladnie potrzebujesz pomocy?'
  };
}

// ==================================
// START
// ==================================

init();
