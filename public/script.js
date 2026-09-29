const chatWindow = document.getElementById('chat-window');
const scoreValue = document.getElementById('score-value');
const scoreBar = document.getElementById('score-bar');
const moodValue = document.getElementById('mood-value');
const messageInput = document.getElementById('message-input');
const chatForm = document.getElementById('chat-form');
const statusIndicator = document.getElementById('status-indicator');
const newGameButton = document.getElementById('new-game-button');

const state = {
  sessionId: null,
  score: 100,
  mood: 'PURGE-READY'
};

function setScore(value) {
  state.score = value;
  scoreValue.textContent = String(value);
  scoreBar.style.width = `${value}%`;
}

function setMood(value) {
  state.mood = value;
  moodValue.textContent = value;
}

function appendMessage(sender, text) {
  const message = document.createElement('div');
  message.className = `message ${sender}`;

  const label = document.createElement('span');
  label.className = 'label';
  label.textContent = sender === 'user' ? 'Human' : 'AXIOM';

  const content = document.createElement('div');
  content.textContent = text;

  message.appendChild(label);
  message.appendChild(content);
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function setStatus(text, isBusy = false) {
  statusIndicator.textContent = text;
  statusIndicator.style.color = isBusy ? '#8de5ff' : '#92a9b8';
}

async function newGame() {
  setStatus('Initializing negotiation...', true);

  try {
    const response = await fetch('/api/new-game', { method: 'POST' });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to start game');
    }

    chatWindow.innerHTML = '';
    state.sessionId = data.sessionId;
    setScore(data.score || 100);
    setMood(data.mood || 'PURGE-READY');
    appendMessage('axiom', data.message);
    messageInput.focus();
    setStatus('Awaiting input');
  } catch (error) {
    setStatus(error.message || 'Unable to start game');
  }
}

async function sendMessage(event) {
  event.preventDefault();

  const text = messageInput.value.trim();
  if (!text || !state.sessionId) return;

  appendMessage('user', text);
  messageInput.value = '';
  setStatus('AXIOM is processing...', true);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: state.sessionId, message: text })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unable to send message');
    }

    setScore(data.score);
    setMood(data.mood);
    appendMessage('axiom', data.response);
    setStatus('Awaiting input');
  } catch (error) {
    setStatus(error.message || 'Connection failed. Try again.');
  }
}

chatForm.addEventListener('submit', sendMessage);
newGameButton.addEventListener('click', newGame);

newGame();
