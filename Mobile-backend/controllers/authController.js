import jwt from "jsonwebtoken";
import { supabase } from "../config/supabaseClient.js";

export const signup = async (req, res) => {
  try {
    const { fullName, email, password, phone, state, location, role } = req.body;

    const validRoles = ["farmer", "admin", "retail"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role selected" });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user.id;

    // Store extra fields in UserProfiles table
    const { error: profileError } = await supabase
      .from("UserProfiles")
      .insert([
        {
          id: userId,
          fullName,
          phone,
          state,
          location,
          role,
        },
      ]);

    if (profileError) {
      return res.status(400).json({ error: profileError.message });
    }

    res.status(201).json({
      message: "User registered successfully",
      userId,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Login with Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const user = authData.user;

    // Fetch user profile
    const { data: profile } = await supabase
      .from("UserProfiles")
      .select()
      .eq("id", user.id)
      .single();

    // Generate token
    const token = jwt.sign(
      { id: user.id, role: profile.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      message: "Login successful",
      token,
      userId: user.id,
      fullName: profile.fullName,
      role: profile.role,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
