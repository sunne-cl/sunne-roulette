'use strict';

const socket = io('http://localhost:5000', {
	transports: ['websocket']
});

const onlineNumberEl = document.getElementById('onlinenumber');

socket.on('updateTotalUsers', (data) => {
  onlineNumberEl.textContent = data.count;
});