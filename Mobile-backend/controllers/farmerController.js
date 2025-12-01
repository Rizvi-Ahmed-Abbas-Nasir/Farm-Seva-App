import { supabase } from "../config/supabaseClient.js";

export const getFarmers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "farmer")
      .order("fullName", { ascending: true });

    if (error) return res.status(400).json({ error: error.message });

    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to load farmers" });
  }
};
