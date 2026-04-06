const mineflayer = require('mineflayer');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const botArgs = {
    host: 'YOUR_SERVER_IP', // Apna IP yaha dalein
    port: 25565,
    username: 'AlphaBot_247',
    version: '1.20.1' 
};

let bot;

function createBot() {
    // Agar bot pehle se hai toh use purana hata do
    if (bot) bot.quit();

    bot = mineflayer.createBot(botArgs);

    bot.on('spawn', () => {
        console.log("Bot spawned in the server!");
    });

    // Stats bhejna (Har 2 second mein taaki CPU load kam rahe)
    setInterval(() => {
        if (bot.entity) {
            const items = bot.inventory.items().map(item => `${item.displayName} x ${item.count}`);
            io.emit('bot_stats', {
                health: Math.round(bot.health),
                food: Math.round(bot.food),
                inventoryList: items,
                name: bot.username,
                pos: `X: ${Math.round(bot.entity.position.x)}, Z: ${Math.round(bot.entity.position.z)}`,
                time: new Date().toLocaleTimeString()
            });
        }
    }, 2000);

    bot.on('chat', (username, message) => {
        io.emit('game_chat', { username, message });
    });

    // Spam rokne ke liye 10 second ka delay
    bot.on('end', (reason) => {
        console.log("Disconnected: " + reason + ". Reconnecting in 10s...");
        setTimeout(createBot, 10000); 
    });

    bot.on('error', (err) => console.log("Error: " + err));
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Controls
io.on('connection', (socket) => {
    socket.on('send_chat', (msg) => { bot.chat(msg); });
    socket.on('move', (dir) => {
        bot.setControlState(dir, true);
        setTimeout(() => bot.setControlState(dir, false), 500);
    });
});

server.listen(3000, () => {
    console.log('Dashboard on http://localhost:3000');
    createBot();
});
