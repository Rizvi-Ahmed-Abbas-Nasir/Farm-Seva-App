import { supabase } from "../config/supabaseClient.js";

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
    const { data: { user }, error } = await supabase.auth.getUser(token);

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
    console.error("Auth server error:", err.message);
    return res.status(401).json({ error: "Authentication failed" });
  }
};
