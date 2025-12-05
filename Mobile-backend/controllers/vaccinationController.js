import { supabase } from "../config/supabaseClient.js";

// Add new vaccination
export const addVaccination = async (req, res) => {
    try {
        console.log('🔍 Request user:', req.user); // Debug log
        console.log('📦 Request body:', req.body); // Debug log

        // Check if user is authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const user_id = req.user.id; // ⬅ GET USER ID FROM TOKEN
        const { species, vaccine_name, scheduled_date, administration_method, notes } = req.body;

        // Validation
        if (!species || !vaccine_name || !scheduled_date) {
            return res.status(400).json({
                error: "Please provide species, vaccine name, and scheduled date"
            });
        }

        // Validate date
        const parsedDate = new Date(scheduled_date);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({
                error: "Invalid date format"
            });
        }

        console.log('📝 Inserting vaccination for user:', user_id);

        const { data, error } = await supabase
            .from("vaccination_schedules")
            .insert([
                {
                    user_id,
                    species,
                    vaccine_name,
                    scheduled_date: parsedDate.toISOString(),
                    administration_method: administration_method || '',
                    notes: notes || ''
                }
            ])
            .select(); // Use .select() to return the inserted data

        if (error) {
            console.error('❌ Supabase error:', error);
            return res.status(400).json({ error: error.message });
        }

        console.log('✅ Vaccination added:', data);

        res.status(201).json({
            success: true,
            message: "Vaccination added successfully",
            data: data[0]
        });
    } catch (err) {
        console.error('💥 Server error:', err);
        res.status(500).json({ error: "Server error: " + err.message });
    }
};

// Get vaccination schedules for a specific user
export const getVaccinations = async (req, res) => {
    try {
        // Get user ID from authenticated user
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const userId = req.user.id; // Use authenticated user ID

        console.log('🔍 Getting vaccinations for user:', userId);

        const { data, error } = await supabase
            .from("vaccination_schedules")
            .select("*")
            .eq("user_id", userId)
            // Default to showing only pending/upcoming unless specified? 
            // For now, let's just order them. Frontend can filter.
            // Or better, filter out 'completed' if the user only wants upcoming.
            .order("scheduled_date", { ascending: true });

        if (error) {
            console.error('❌ Supabase error:', error);
            return res.status(400).json({ error: error.message });
        }

        // Filter out done vaccinations in JS to handle NULL status correctly
        // (SQL '!=' excludes NULLs, so we do it here)
        const activeVaccinations = data.filter(v => v.status !== 'done');

        console.log(`✅ Found ${activeVaccinations.length} active vaccinations (from ${data.length} total) for user ${userId}`);

        res.json({
            success: true,
            count: activeVaccinations.length,
            data: activeVaccinations
        });
    } catch (err) {
        console.error('💥 Server error:', err);
        res.status(500).json({ error: "Server error: " + err.message });
    }
};

// Get single vaccination by ID
export const getVaccinationById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const { data, error } = await supabase
            .from("vaccination_schedules")
            .select("*")
            .eq("id", id)
            .eq("user_id", userId)
            .single();

        if (error) {
            return res.status(404).json({ error: "Vaccination not found" });
        }

        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update vaccination status (e.g. mark as completed)
export const updateVaccinationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // e.g., 'done'
        const userId = req.user.id;

        console.log(`📝 Updating vaccination ${id} status to ${status}`);

        const { data, error } = await supabase
            .from("vaccination_schedules")
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