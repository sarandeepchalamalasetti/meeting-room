const jwt = require('jsonwebtoken');
const User = require('../models/User');
const dotenv = require('dotenv');
dotenv.config();

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    console.log('🔐 Auth Header:', authHeader ? 'Present' : 'Missing');

    if (!authHeader) {
      return res.status(401).json({ 
        message: 'Access Denied. No token provided.',
        debug: 'No Authorization header found'
      });
    }

    // ✅ Extract only the token part (after "Bearer ")
    const token = authHeader.split(' ')[1];
    console.log('🔐 Token extracted:', token ? 'Present' : 'Missing');

    if (!token) {
      return res.status(401).json({ 
        message: 'Invalid token format.',
        debug: 'Token is empty after Bearer extraction'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log('🔐 Decoded token:', JSON.stringify(decoded, null, 2));
      
      // ✅ ENHANCED: If email is missing from token, fetch user data from database
      if (!decoded.email && decoded.id) {
        console.log('⚠️ Email missing from token, fetching user data from database...');
        
        try {
          const user = await User.findById(decoded.id);
          if (user) {
            console.log('✅ User data fetched from database:', {
              id: user._id,
              email: user.email,
              name: user.name,
              role: user.role
            });
            
            // Set complete user data
            req.user = {
              id: user._id.toString(),
              email: user.email,
              name: user.name,
              role: user.role,
              employeeId: user.employeeId
            };
          } else {
            console.log('❌ User not found in database for ID:', decoded.id);
            return res.status(401).json({ 
              message: 'User not found. Please log in again.',
              debug: 'User ID from token not found in database'
            });
          }
        } catch (dbError) {
          console.error('❌ Database error while fetching user:', dbError);
          return res.status(500).json({ 
            message: 'Authentication error',
            debug: 'Database error while verifying user'
          });
        }
      } else {
        // Token has complete user data
        req.user = {
          id: decoded.id || decoded.userId || decoded._id,
          email: decoded.email || decoded.userEmail,
          name: decoded.name || decoded.username || decoded.fullName,
          role: decoded.role || 'employee',
          employeeId: decoded.employeeId || decoded.id
        };
      }
      
      console.log('🔐 Final req.user:', JSON.stringify(req.user, null, 2));
      
      // Verify we have email now
      if (!req.user.email) {
        return res.status(401).json({ 
          message: 'Invalid token data. Please log in again.',
          debug: 'Email could not be determined from token or database'
        });
      }
      
      next();
    } catch (jwtError) {
      console.error('🔐 JWT verification failed:', jwtError.message);
      return res.status(401).json({ 
        message: 'Invalid or expired token. Please log in again.',
        debug: jwtError.message
      });
    }
  } catch (error) {
    console.error('🔐 Token verification error:', error);
    return res.status(500).json({ 
      message: 'Authentication error',
      debug: error.message
    });
  }
};

module.exports = verifyToken;