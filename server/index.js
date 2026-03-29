import express from 'express';
import cors from 'cors';
import geoRoutes from './routes/router.js';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'ngrok-skip-browser-warning']
}));

// Додай цей блок спеціально для Ngrok
app.use((req, res, next) => {
    res.setHeader('ngrok-skip-browser-warning', 'true');
    next();
});

app.use('/api/geo', geoRoutes);

app.use((err, req, res, next) => {
    console.error('[EXPRESS ERROR]', err.message);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        success: false
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend API Parser Server running on port ${PORT}`);
});