import { supabase } from "../config/supabaseClient.js";

// Helper function to add timeout to promises
const withTimeout = (promise, timeoutMs) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

export const userAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (req.method === "OPTIONS") {
    return next();
  }

  if (!authHeader?.startsWith("Bearer ")) {
    console.error("Auth error: Missing auth header");
    return res.status(401).json({ error: "Missing auth header" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Add 5 second timeout for Supabase connection
    const { data: { user }, error } = await withTimeout(
      supabase.auth.getUser(token),
      5000
    );

    if (error || !user) {
      console.error("Auth error:", error?.message || "User not found");
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || "farmer",
    };

    next();
  } catch (err) {
    // Check if it's a timeout or connection error
    if (err.message.includes("timeout") || err.message.includes("fetch failed") || err.code === "UND_ERR_CONNECT_TIMEOUT") {
      console.error("❌ Supabase connection timeout - check network/firewall");
      console.error("Error details:", err.message);
      return res.status(503).json({ 
        error: "Service temporarily unavailable",
        message: "Unable to connect to authentication service. Please check your internet connection."
      });
    }
    
    console.error("Auth server error:", err.message);
    return res.status(401).json({ error: "Authentication failed" });
  }
};
