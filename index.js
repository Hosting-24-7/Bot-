const mineflayer = require('mineflayer');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const botArgs = {
    host: 'YOUR_SERVER_IP', 
    port: 25565,
    username: 'AlphaBot_247',
    version: '1.20.1' // Apne server version ke hisaab se badlein
};

let bot;

function createBot() {
    bot = mineflayer.createBot(botArgs);

    bot.on('spawn', () => {
        console.log("Bot spawned in the server!");
    });

    // Dashboard ko real-time data bhejna
    setInterval(() => {
        if (bot.entity) {
            io.emit('bot_stats', {
                health: Math.round(bot.health),
                food: Math.round(bot.food),
                inventory: bot.inventory.items().length,
                name: bot.username,
                pos: bot.entity.position,
                time: new Date().toLocaleTimeString()
            });
        }
    }, 1000);

    bot.on('chat', (username, message) => {
        io.emit('game_chat', { username, message });
    });

    bot.on('end', () => {
        console.log("Disconnected. Reconnecting in 5s...");
        setTimeout(createBot, 5000);
    });
}

// Dashboard Routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Socket.io for Controls
io.on('connection', (socket) => {
    socket.on('send_chat', (msg) => {
        bot.chat(msg);
    });

    socket.on('move', (dir) => {
        bot.setControlState(dir, true);
        setTimeout(() => bot.setControlState(dir, false), 500);
    });
});

server.listen(3000, () => {
    console.log('Dashboard running on http://localhost:3000');
    createBot();
});
