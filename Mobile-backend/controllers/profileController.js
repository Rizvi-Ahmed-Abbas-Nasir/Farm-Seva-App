// controllers/profileController.js
import { supabase } from "../config/supabaseClient.js";

export const getProfile = async (req, res) => {
  try {
    // Get user ID from authenticated request (from middleware)
    const userId = req.user.id; // Changed from req.userId to req.user.id
    
    console.log('🔍 Fetching profile for user ID:', userId);

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      return res.status(404).json({ error: "User not found" });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log('✅ Profile found:', user.email);
    
    // Format response
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone || '',
        state: user.state || '',
        location: user.location || '',
        role: user.role || 'farmer',
        image: user.image || null,
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error('💥 Server error:', err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
};