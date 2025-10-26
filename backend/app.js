const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const scenarioRoutes = require('./routes/scenario');

dotenv.config();
const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'https://split-project-frontend-57uf0rhvf-jahnaviaddagarla666s-projects.vercel.app' }));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/scenario', scenarioRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));