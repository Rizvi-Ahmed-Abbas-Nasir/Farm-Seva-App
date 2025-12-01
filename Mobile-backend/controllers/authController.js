import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../config/supabaseClient.js";

export const signup = async (req, res) => {
  try {
    const { fullName, email, password, phone, state, location, role } = req.body;

    const validRoles = ["farmer", "admin", "retail"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role selected" });
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select()
      .eq("email", email)
      .single();

    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert([
        { fullName, email, password: hashed, phone, state, location, role }
      ])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({ message: "User registered", userId: data.id });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user } = await supabase
      .from("users")
      .select()
      .eq("email", email)
      .single();

    if (!user) return res.status(404).json({ error: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      userId: user.id,
      fullName: user.fullName,
      role: user.role
    });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
