// controllers/profileController.js
import { supabase } from "../config/supabaseClient.js";

export const getProfile = async (req, res) => {
  try {
    // Get user ID from authenticated request (from middleware)
    const userId = req.user.id;

    console.log('🔍 Fetching profile for user ID:', userId);

    // Query profiles table (lowercase)
    const { data: user, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which we'll handle below
      console.error('❌ Supabase error:', error);
      return res.status(500).json({ error: "Database error: " + error.message });
    }

    // If profile doesn't exist, try to get user metadata from auth
    if (!user) {
      console.log('⚠️ Profile not found in profiles, fetching from auth metadata');

      const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(userId);

      if (authError || !authUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Create profile from user_metadata if available
      const metadata = authUser.user_metadata || {};

      // Handle both 'fullname' and 'fullName' variations
      const fullName = metadata.fullName || metadata.fullname || metadata.full_name || 'User';

      // Try to insert the profile
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          full_name: fullName,  // Use snake_case for DB
          phone: metadata.phone || '',
          state: metadata.state || '',
          location: metadata.location || '',
          role: metadata.role || 'farmer',
        });

      if (insertError) {
        console.error('❌ Error creating profile:', insertError);
        // Return basic info even if we can't create the profile
        const fullName = metadata.fullName || metadata.fullname || metadata.full_name || 'User';
        return res.json({
          success: true,
          data: {
            id: userId,
            email: authUser.email,
            fullName: fullName,
            phone: metadata.phone || '',
            state: metadata.state || '',
            location: metadata.location || '',
            role: metadata.role || 'farmer',
            image: null
          }
        });
      }

      console.log('✅ Profile created from metadata');

      // Return the data we just inserted
      return res.json({
        success: true,
        data: {
          id: userId,
          email: authUser.email,
          fullName: fullName,
          phone: metadata.phone || '',
          state: metadata.state || '',
          location: metadata.location || '',
          role: metadata.role || 'farmer',
          image: null,
          created_at: new Date().toISOString()
        }
      });
    }

    console.log('✅ Profile found:', user.email || userId);

    // Get email from auth since it's not in profiles
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);

    // Format response with camelCase column names for API
    res.json({
      success: true,
      data: {
        id: user.id,
        email: authUser?.email || '',
        fullName: user.full_name,  // Convert from snake_case
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