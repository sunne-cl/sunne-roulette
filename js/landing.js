'use strict';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://sunne-roullete-backend.onrender.com';

const socket = io(BACKEND_URL, {
  transports: ['websocket']
});

function goto(url) {
  window.location.href = url;
}

const onlineNumberEl = document.getElementById('onlinenumber');

socket.on('updateTotalUsers', (data) => {
  onlineNumberEl.textContent = data.count;
});