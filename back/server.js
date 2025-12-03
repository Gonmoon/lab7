const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/protected', require('./routes/protected')); // Добавьте эту строку
app.use('/api/publications', require('./routes/publications'));
app.use('/api/recipients', require('./routes/recipients'));
app.use('/api/subscriptions', require('./routes/subscriptions'));


// Health check (публичный)
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'Error', 
      database: 'Disconnected',
      error: error.message 
    });
  }
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Sync database and start server
async function startServer() {
  try {
    await sequelize.sync({ force: false });
    console.log('Database synchronized');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Auth API: http://localhost:${PORT}/api/auth`);
      console.log(`Protected API: http://localhost:${PORT}/api/protected`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer();