import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './Routes/auth.routes';
import userRoutes from './Routes/user.routes';
import productRoutes from './Routes/product.routes';
import categoryRoutes from './Routes/category.routes';
import analyticRoutes from './Routes/analytic.routes';
import cors from 'cors'

import path from 'path';

dotenv.config();

const app = express();
const server = http.createServer(app);
// ✅ Enable CORS for all origins, ports, and methods
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ✅ Socket.IO setup with full CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI!);

// Middleware
app.use(express.json());

// Routes (placeholder)
app.get('/', (req, res) => {
  res.json({ message: 'API + Socket.IO ready!' });
});

// 🆕 Socket Connection Handler
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // Join user to a room (e.g., by role or store ID)
  socket.on('join-room', (room: string) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});


app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

app.use('/api/analytic', analyticRoutes);
// Emit real-time alerts from anywhere in your app!
export { io };

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});