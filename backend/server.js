const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const intakeRoutes = require('./routes/intake');
app.use('/api', intakeRoutes);
app.use('/api', require('./routes/invites'));

const notetakerRoutes = require('./routes/notetaker');
app.use('/api/notetaker', notetakerRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "${process.env.FRONTEND_URL}",
    methods: ["GET", "POST"]
  }
});
app.set('io', io);

// Basic test route
app.get('/', (req, res) => {
  res.send('EasyLaw backend is running');
});

// Socket.io connection for real-time dashboard
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
