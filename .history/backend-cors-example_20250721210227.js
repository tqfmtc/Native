// Example CORS configuration for your Node.js backend
// Install: npm install cors

const express = require('express');
const cors = require('cors');
const app = express();

// Option 1: Allow all origins (for development)
app.use(cors());

// Option 2: Specific configuration (for production)
app.use(cors({
  origin: [
    'http://localhost:3000',           // Web app
    'http://localhost:8081',           // Expo dev server
    'http://localhost:8084',           // Expo dev server (alternative port)
    'exp://192.168.1.100:8081',        // Expo Go app (replace with your IP)
    'https://your-web-domain.com'      // Production web app
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Your existing routes
app.use('/api', yourApiRoutes);

// Example of manual CORS headers (if not using cors middleware)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});