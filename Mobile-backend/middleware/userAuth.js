import jwt from "jsonwebtoken";

export const userAuth = (req, res, next) => {
  console.log('🔐 [Auth Middleware] Starting authentication check...');
  console.log('🔐 [Auth Middleware] Request URL:', req.originalUrl);
  console.log('🔐 [Auth Middleware] Request method:', req.method);
  console.log('🔐 [Auth Middleware] Headers:', JSON.stringify(req.headers, null, 2));
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    console.log(' [Auth Middleware] No Authorization header found');
    return res.status(401).json({ error: "Missing authorization header" });
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    console.log(' [Auth Middleware] Invalid Authorization header format');
    console.log(' [Auth Middleware] Header value:', authHeader);
    return res.status(401).json({ error: "Invalid authorization header format. Expected: Bearer <token>" });
  }

  const token = authHeader.split(" ")[1];
  
  if (!token) {
    console.log('[Auth Middleware] No token found in Authorization header');
    return res.status(401).json({ error: "Missing token" });
  }

  console.log(' [Auth Middleware] Token received (first 50 chars):', token.substring(0, 50) + '...');
  console.log('[Auth Middleware] Token length:', token.length);

  try {
    if (!process.env.JWT_SECRET) {
      console.error(' [Auth Middleware] JWT_SECRET is not set in environment variables');
      return res.status(500).json({ error: "Server configuration error" });
    }
    
    console.log(' [Auth Middleware] Verifying token with secret...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log(' [Auth Middleware] Token decoded successfully');
    console.log(' [Auth Middleware] Decoded payload:', decoded);
    
    req.user = {
      id: decoded.id || decoded.userId || decoded.sub,
      role: decoded.role || 'user',
      email: decoded.email || null
    };
    
    console.log('[Auth Middleware] User object set:', req.user);
    console.log(' [Auth Middleware] Authentication successful for user ID:', req.user.id);
    
    next();
  } catch (err) {
    console.error(' [Auth Middleware] Token verification error:', err.message);
    console.error(' [Auth Middleware] Error name:', err.name);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: "Invalid token" });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token expired" });
    }
    
    return res.status(401).json({ error: "Authentication failed: " + err.message });
  }
};