const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Import and use your auth routes
const authRoutes = require('./routes/auth'); // Make sure this file exists!
const mealsRoutes = require('./routes/meals');  // for meals
const plansRoutes = require('./routes/plans'); // for meal plans
const workoutRoutes = require('./routes/workout');
const profileRoutes = require('./routes/profile');
app.use('/auth', authRoutes);
app.use('/workout', workoutRoutes);
app.use('/meals', mealsRoutes);
app.use('/plans', plansRoutes);
app.use('/profile', profileRoutes);

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));