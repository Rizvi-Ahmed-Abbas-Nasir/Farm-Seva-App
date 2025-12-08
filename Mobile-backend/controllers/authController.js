import { supabase } from "../config/supabaseClient.js";

export const signup = async (req, res) => {
  try {
    const { fullName, email, password, phone, state, location, role } = req.body;

    // Validate required fields
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: "Email, password, and full name are required" });
    }

    const validRoles = ["farmer", "admin", "retail"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role selected" });
    }

    // Create user in Supabase Auth with metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          fullName,
          fullname: fullName, // Support both variations
          phone: phone || '',
          state: state || '',
          location: location || '',
          role: role || 'farmer',
        },
      },
    });

    if (authError) {
      console.error('❌ Signup error:', authError);
      return res.status(400).json({ error: authError.message });
    }

    if (!authData.user) {
      return res.status(400).json({ error: "Failed to create user" });
    }

    const userId = authData.user.id;
    console.log('✅ User created in auth:', userId);

    // Create profile in profiles table
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        full_name: fullName,  // Use snake_case
        phone: phone || '',
        state: state || '',
        location: location || '',
        role: role || 'farmer',
      });

    if (profileError) {
      console.error('❌ Profile creation error:', profileError);
      // Don't fail the signup if profile creation fails
      // The profile will be auto-created on first login
      console.log('⚠️ Profile will be auto-created on first login');
    } else {
      console.log('✅ Profile created in database');
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      userId,
      user: {
        id: userId,
        email: authData.user.email,
        fullName,
        role: role || 'farmer',
      }
    });
  } catch (err) {
    console.error('💥 Signup server error:', err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Login with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('❌ Login error:', authError);
      return res.status(400).json({ error: "Invalid email or password" });
    }

    if (!authData.user || !authData.session) {
      return res.status(400).json({ error: "Login failed" });
    }

    const user = authData.user;
    const token = authData.session.access_token;

    console.log('✅ User logged in:', user.email);

    // Try to fetch user profile from database
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // If profile doesn't exist, create it from user metadata
    let userProfile = profile;
    if (profileError || !profile) {
      console.log('⚠️ Profile not found, creating from metadata');

      const metadata = user.user_metadata || {};
      const fullName = metadata.fullName || metadata.fullname || metadata.full_name || 'User';

      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert([{
          id: user.id,
          full_name: fullName,  // Use snake_case
          phone: metadata.phone || '',
          state: metadata.state || '',
          location: metadata.location || '',
          role: metadata.role || 'farmer',
        }])
        .select()
        .single();

      if (!createError && newProfile) {
        userProfile = newProfile;
        console.log('✅ Profile created from metadata');
      } else {
        console.error('❌ Failed to create profile:', createError);
        // Use metadata as fallback
        userProfile = {
          id: user.id,
          fullName: fullName,
          phone: metadata.phone || '',
          state: metadata.state || '',
          location: metadata.location || '',
          role: metadata.role || 'farmer',
        };
      }
    }

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: userProfile.full_name || userProfile.fullName,  // Handle both
        phone: userProfile.phone,
        state: userProfile.state,
        location: userProfile.location,
        role: userProfile.role,
      }
    });
  } catch (err) {
    console.error('💥 Login server error:', err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
};
