import { supabase } from "../config/supabaseClient.js";

// Add a new animal checkup
export const addCheckup = async (req, res) => {
    try {
        console.log('📝 Received add checkup request:', req.body);
        console.log('👤 User from token:', req.user);

        const { species, animal_name, scheduled_date, administration, notes } = req.body;
        const userId = req.user.id;

        // Validation
        if (!species || !animal_name || !scheduled_date) {
            console.log('❌ Missing required fields');
            return res.status(400).json({ error: "Species, Animal Name, and Scheduled Date are required" });
        }

        // Insert into Supabase
        const { data, error } = await supabase
            .from("animal_checkup")
            .insert([
                {
                    user_id: userId,
                    species,
                    animal_name,
                    scheduled_date,
                    administration, // Using 'administration' as per user schema (vs 'administration_method' in vac)
                    notes
                }
            ])
            .select();

        if (error) {
            console.error('❌ Supabase insert error:', error);
            return res.status(400).json({ error: error.message });
        }

        console.log('✅ Checkup added successfully:', data);
        res.status(201).json({ success: true, data: data[0] });

    } catch (err) {
        console.error('💥 Server error:', err);
        res.status(500).json({ error: "Server error: " + err.message });
    }
};

// Get checkups for a specific user
export const getCheckups = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const userId = req.user.id;
        console.log('🔍 Getting checkups for user:', userId);

        const { data, error } = await supabase
            .from("animal_checkup")
            .select("*")
            .eq("user_id", userId)
            .order("scheduled_date", { ascending: true });

        if (error) {
            console.error('❌ Supabase error:', error);
            return res.status(400).json({ error: error.message });
        }

        // Filter out 'done' checkups in JS to handle potential NULL status
        const activeCheckups = data.filter(c => c.status !== 'done');

        console.log(`✅ Found ${activeCheckups.length} active checkups for user ${userId}`);

        res.json({
            success: true,
            count: activeCheckups.length,
            data: activeCheckups
        });
    } catch (err) {
        console.error('💥 Server error:', err);
        res.status(500).json({ error: "Server error: " + err.message });
    }
};

// Get single checkup by ID
export const getCheckupById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const { data, error } = await supabase
            .from("animal_checkup")
            .select("*")
            .eq("id", id)
            .eq("user_id", userId)
            .single();

        if (error) {
            return res.status(404).json({ error: "Checkup not found" });
        }

        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update checkup status
export const updateCheckupStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // e.g., 'done'
        const userId = req.user.id;

        console.log(`📝 Updating checkup ${id} status to ${status}`);

        const { data, error } = await supabase
            .from("animal_checkup")
            .update({ status })
            .eq("id", id)
            .eq("user_id", userId)
            .select();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ success: true, data: data[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
