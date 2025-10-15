// Simple mock server for testing the login functionality
// Run with: node mock-server.js

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Enable CORS for all origins (development only)
app.use(cors());
app.use(express.json());

// Mock data
const mockTutors = [
  {
    _id: '507f1f77bcf86cd799439011',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    role: 'tutor',
    token: 'mock-jwt-token-123',
    assignedCenter: {
      _id: '507f1f77bcf86cd799439012',
      name: 'Main Center',
      location: 'Downtown',
      coordinates: [77.2090, 28.6139] // [longitude, latitude] - Delhi coordinates
    }
  }
];

// Login endpoint
app.post('/api/auth/tutor/login', (req, res) => {
  const { phone, password } = req.body;
  
  console.log('Login attempt:', { phone, password });
  
  // Simple validation
  if (!phone || !password) {
    return res.status(400).json({
      message: 'Phone and password are required'
    });
  }
  
  // Mock authentication - accept any phone with password "123456"
  if (password === '123456') {
    const tutor = mockTutors[0];
    tutor.phone = phone; // Use the provided phone number
    
    return res.json(tutor);
  }
  
  // Invalid credentials
  return res.status(401).json({
    message: 'Invalid phone number or password'
  });
});

// Attendance endpoint
app.post('/api/tutors/attendance', (req, res) => {
  const authHeader = req.headers.authorization;
  const { currentLocation } = req.body;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Authorization token required'
    });
  }
  
  if (!currentLocation || !Array.isArray(currentLocation) || currentLocation.length !== 2) {
    return res.status(400).json({
      message: 'Valid current location coordinates required'
    });
  }
  
  // Mock successful attendance
  return res.json({
    message: 'Attendance marked successfully',
    attendance: {
      _id: '507f1f77bcf86cd799439013',
      tutorId: '507f1f77bcf86cd799439011',
      centerId: '507f1f77bcf86cd799439012',
      timestamp: new Date().toISOString(),
      location: currentLocation,
      status: 'present'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Mock server is running' });
});

app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- POST /api/auth/tutor/login');
  console.log('- POST /api/tutors/attendance');
  console.log('- GET /api/health');
  console.log('\nTest credentials:');
  console.log('- Phone: any number');
  console.log('- Password: 123456');
});