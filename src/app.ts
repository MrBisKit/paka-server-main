import express from 'express';

import deliveryRoutes from './routes/delivery.routes';
import authRoutes from './routes/auth.routes';
import healthRoutes from './routes/health.routes';

const app = express();
require('dotenv').config();

app.use(express.json());

// Routes
app.use('/api/delivery', deliveryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);

export default app;
