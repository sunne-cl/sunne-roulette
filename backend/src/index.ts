import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
	 cors: {
		 origin: "http://127.0.0.1:7777",
     methods: ['GET', 'POST'],
		 credentials: true
		},
		transports: ['websocket']
});

interface User {
	id: string;
	roomId?: string;
}

type AckResponse = 
 | { success: true }
 | { success: false; error: string };

let searchQueue: User[] = [];

io.on('connection', (socket) => {
  console.log('Пользователь подключился:', socket.id);

	io.emit('updateTotalUsers', { count: io.engine.clientsCount });


	socket.on('startSearch', (data?: { username?: string, avatar?: string }) => {
		if (socket.data.roomId) {
			return;
		}

		socket.data.username = data?.username || 'гей';
		socket.data.avatar = data?.avatar || '../img/default.png';

    if (!(searchQueue.some(user => user.id === socket.id))) {
      searchQueue.push({ id: socket.id });
			
			if (searchQueue.length >= 2) {
        const user1 = searchQueue.shift();
				const user2 = searchQueue.shift();
				
				if (user1 && user2) {
					const roomName = `room_${user1.id}_${user2.id}`;

					const socket1 = io.sockets.sockets.get(user1.id);
					const socket2 = io.sockets.sockets.get(user2.id);

					if (socket1 && socket2) {
						socket1.join(roomName);
						socket2.join(roomName);
            
						socket1.data.roomId = roomName;
						socket2.data.roomId = roomName;
						socket1.emit('chatStarted', { roomId: roomName, companionName: socket2.data.username, avatar: socket2.data.avatar });
						socket2.emit('chatStarted', { roomId: roomName, companionName: socket1.data.username, avatar: socket1.data.avatar });
					}
				}
			}
		}
	});

	socket.on('disconnect', () => {
		io.emit('updateTotalUsers', { count: io.engine.clientsCount });
    searchQueue = searchQueue.filter(user => user.id !== socket.id);
		console.log('Пользователь отключился:', socket.id);

		const roomId = socket.data.roomId;

		if (roomId) {
      socket.to(roomId).emit('companionLeft');
		}
	});

	socket.on('getQueueLength', () => {
    socket.emit('queueStatus', searchQueue.length);
	});

	socket.on('sendMessage', (message: string, ack: (response: AckResponse) => void) => {
    if (message.length === 0 || message.trim().length === 0) {
       ack({ success: false, error: 'Сообщение не может быть пустым' });
		} else {
			const roomId = socket.data.roomId;

			if (!roomId) {
				return ack({ success: false, error: 'Вы не находитесь в чате' });
			}

			socket.to(roomId).emit('newMessage', { text: message.trim(), sender: socket.id, timestamp: Date.now()});
			ack({ success: true });
		}
	});

	socket.on('leaveChat', () => {
		const roomId = socket.data.roomId;
		if (roomId) {
			socket.to(roomId).emit('companionLeft');
			socket.leave(roomId);
		}
		delete socket.data.roomId;
    searchQueue = searchQueue.filter(user => user.id !== socket.id);
	});

	socket.on('typing', () => {
    const roomId = socket.data.roomId;
		if (roomId) {
			socket.to(roomId).emit('companionTyping');
		}
	});

	console.log('Очередь поика:', searchQueue);
});

app.get('/', (req, res) => {
  res.send('привет');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('Сервер запущен: ', `http://localhost:${PORT}`);
});