'use strict';

const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restart');
const stopBtn = document.getElementById('stop');
const chatSendBtn = document.getElementById('send');
const welcomeScreen = document.getElementById('welcome-screen');
const chatScreen = document.getElementById('chat-screen');
const chatInput = document.getElementById('chatp');
const chatContainer = document.getElementById('chat-container');
const statusEl = document.getElementById('status');
const onlineNumberEl = document.getElementById('onlinenumber');
const usernameInput = document.getElementById('username');
const saveNameBtn = document.getElementById('save');
const avatarBtn = document.getElementById('avatarBtn');
const avatarInput = document.getElementById('avatarInput');
const avatarPreview = document.getElementById('avatarPreview');

let typingTimeout;
let companionName = 'Companion';
let companionAvatar = '../img/default.png';

const savedName = localStorage.getItem('username');
if (savedName) {
  usernameInput.value = savedName;
}

const savedAvatar = localStorage.getItem('avatar');
if (savedAvatar) {
  avatarPreview.src = savedAvatar;
  avatarPreview.style.display = 'block';
}

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://sunne-roullete-backend.onrender.com';

const socket = io(BACKEND_URL, {
  transports: ['websocket']
});

function goto(url) {
  window.location.href = url;
}

function getCleanUsername() {
  let name = usernameInput.value.trim();
  if (name.length > 16) {
    name = name.substring(0, 16);
  }
  return name || 'гей';
}

const chatArea = document.querySelector('.chat');
let scrollBtn;

let isAutoScrolling = false;

function isUserAtBottom() {
  if (!chatArea) return true;
  return chatArea.scrollHeight - chatArea.scrollTop - chatArea.clientHeight < 150;
}

function scrollToBottom() {
  if (!chatArea) return;
  isAutoScrolling = true;
  chatArea.scrollTo({
    top: chatArea.scrollHeight,
    behavior: 'smooth'
  });
  setTimeout(() => {
    isAutoScrolling = false;
  }, 400);
}

function initScrollBtn() {
  if (!document.querySelector('.scroll-btn')) {
    scrollBtn = document.createElement('button');
    scrollBtn.className = 'scroll-btn';
    scrollBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M480-360 280-560h400L480-360Z"/></svg> Новые сообщения';
    scrollBtn.addEventListener('click', () => {
      scrollToBottom();
      scrollBtn.classList.remove('show');
    });
    document.querySelector('#chat-screen .main').appendChild(scrollBtn);
    
    if (chatArea) {
      chatArea.addEventListener('scroll', () => {
        if (isAutoScrolling) return;
        if (isUserAtBottom()) {
          scrollBtn.classList.remove('show');
        }
      });
    }
  }
}

// Initialize scroll button when script loads
initScrollBtn();

function appendMessage(text, type) {
  chatInput.disabled = false;

  const containerEl = document.createElement('div');
  containerEl.classList.add((type === 'my' ? 'coms' : type === 'companion' ? 'mes' : 'system-msg'), 'ss', 'dddd');

  const authorEl = document.createElement('p');
  authorEl.classList.add('pss');
  authorEl.textContent = type === 'my' ? 'You' : type === 'companion' ? companionName : 'System';

  const messageEl = document.createElement('span');
  messageEl.textContent = text;

  const rowEl = document.createElement('div');
  rowEl.classList.add('message-row');

  const avatarEl = document.createElement('img');
  avatarEl.classList.add('msg-avatar');
  
  if (type === 'my') {
    rowEl.classList.add('my-row');
    avatarEl.src = savedAvatar || '../img/default.png';
    rowEl.append(containerEl, avatarEl);
  }

  if (type === 'companion') {
    rowEl.classList.add('companion-row');
    avatarEl.src = companionAvatar || '../img/default.png';
    rowEl.append(avatarEl, containerEl);
  }

  if (type === 'system') {
    chatInput.disabled = true;
    authorEl.textContent = 'System';
    authorEl.style.color = 'red';
    statusEl.innerText = 'Собеседник отключился';
    chatInput.value = '';
  }

  containerEl.append(authorEl, messageEl);

  const wasAtBottom = isUserAtBottom();

  chatContainer.append(rowEl);

  if (type === 'my' || wasAtBottom) {
    scrollToBottom();
  } else {
    if (scrollBtn) {
      scrollBtn.classList.add('show');
    }
  }
}

function sendMessage() {
  const message = chatInput.value.trim();

  if (message.length === 0) return;

  socket.emit('sendMessage', message, (response) => {
    if (response.success === true) {
      chatInput.value = '';
      appendMessage(message, 'my');
    } else {
      console.error(response.error);
    }
  });
}

startBtn.addEventListener('click', () => {
  startBtn.innerText = 'Search...';
  startBtn.disabled = true;
  statusEl.innerText = 'Поиск собеседника...';

  const name = getCleanUsername();
  socket.emit('startSearch', { username: name, avatar: localStorage.getItem('avatar') || '../img/default.png' });
  localStorage.setItem('username', name);
});

restartBtn.addEventListener('click', () => {
 socket.emit('leaveChat');
 chatContainer.innerHTML = '';
 statusEl.innerText = 'Поиск собеседника...';
 chatInput.disabled = true;
 chatInput.value = '';
 const name = getCleanUsername();
 socket.emit('startSearch', { username: name, avatar: localStorage.getItem('avatar') || '../img/default.png' });
});

stopBtn.addEventListener('click', () => {
  socket.emit('leaveChat');
  startBtn.innerHTML = 'Start';
  startBtn.disabled = false;
  chatContainer.innerHTML = '';
  welcomeScreen.style.display = 'block';
  chatScreen.style.display = 'none';
});

saveNameBtn.addEventListener('click', () => {
  const name = getCleanUsername();
  localStorage.setItem('username', name);
});

avatarBtn.addEventListener('click', () => {
  avatarInput.click();
});

avatarInput.addEventListener('change', (e) => {
  const file = e.target.files[0];

  const reader = new FileReader();

  reader.onload = () => {
    const img = new Image();
    img.src = reader.result;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = 120;
      canvas.height = 120;

      ctx.drawImage(img, 0, 0, 120, 120);

      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

      localStorage.setItem('avatar', compressedBase64);

      avatarPreview.src = compressedBase64;
      avatarPreview.style.display = 'block';
    };

  };
  reader.readAsDataURL(file);
});

socket.on('companionTyping', () => {
  statusEl.innerText = 'Собеседник печатает...';

  clearTimeout(typingTimeout);

  typingTimeout = setTimeout(() => {
    statusEl.innerText = 'Собеседник найден';
  }, 1500);
});

socket.on('updateTotalUsers', (data) => {
  console.log('Server data about users:', data);
  onlineNumberEl.textContent = data.count;
});

socket.on('chatStarted', (data) => {
  if (data) {
    welcomeScreen.style.display = 'none';
    chatScreen.style.display = 'block';
    statusEl.innerText = 'Собеседник найден';
    chatInput.disabled = false;
    companionName = data.companionName || 'Companion';
    companionAvatar = data.avatar || './img/default.png';
  }
});

chatSendBtn.addEventListener('click', sendMessage);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

chatInput.addEventListener('input', () => {
  socket.emit('typing');
});

socket.on('newMessage', (data) => {
  console.log(data);
  appendMessage(data.text, 'companion');
});

socket.on('companionLeft', () => {
  appendMessage('Собеседник отключился', 'system');
}); 