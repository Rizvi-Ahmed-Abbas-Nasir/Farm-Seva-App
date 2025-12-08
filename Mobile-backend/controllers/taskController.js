import { supabase } from "../config/supabaseClient.js";

// Add new task
export const addTask = async (req, res) => {
    try {
        console.log('🔍 Request user:', req.user);
        console.log('📦 Request body:', req.body);

        // Check if user is authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const user_id = req.user.id;
        const { task_name, description, task_date, task_time, goal } = req.body;

        // Validation
        if (!task_name || !task_date || !task_time) {
            return res.status(400).json({
                success: false,
                error: "Please provide task name, date, and time"
            });
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(task_date)) {
            return res.status(400).json({
                success: false,
                error: "Invalid date format. Please use YYYY-MM-DD"
            });
        }

        // Validate time format (HH:MM)
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(task_time)) {
            return res.status(400).json({
                success: false,
                error: "Invalid time format. Please use HH:MM (24-hour format)"
            });
        }

        console.log('📝 Inserting task for user:', user_id);

        const { data, error } = await supabase
            .from("tasks")
            .insert([
                {
                    user_id,
                    task_name: task_name.trim(),
                    description: description?.trim() || null,
                    task_date,
                    task_time,
                    goal: goal?.trim() || null,
                    completed: false
                }
            ])
            .select();

        if (error) {
            console.error('❌ Supabase error:', error);
            return res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }

        console.log('✅ Task added:', data);

        res.status(201).json({
            success: true,
            message: "Task created successfully",
            data: data[0]
        });
    } catch (err) {
        console.error('💥 Server error:', err);
        res.status(500).json({ 
            success: false,
            error: "Server error: " + err.message 
        });
    }
};

// Get all tasks for a specific user
export const getTasks = async (req, res) => {
    try {
        // Get user ID from authenticated user
        if (!req.user || !req.user.id) {
            return res.status(401).json({ 
                success: false,
                error: "User not authenticated" 
            });
        }

        const userId = req.user.id;

        console.log('🔍 Getting tasks for user:', userId);

        const { data, error } = await supabase
            .from("tasks")
            .select("*")
            .eq("user_id", userId)
            .order("task_date", { ascending: true })
            .order("task_time", { ascending: true });

        if (error) {
            console.error('❌ Supabase error:', error);
            return res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }

        console.log(`✅ Found ${data.length} tasks for user ${userId}`);

        res.json({
            success: true,
            count: data.length,
            data: data || []
        });
    } catch (err) {
        console.error('💥 Server error:', err);
        res.status(500).json({ 
            success: false,
            error: "Server error: " + err.message 
        });
    }
};

// Get single task by ID
export const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!req.user || !req.user.id) {
            return res.status(401).json({ 
                success: false,
                error: "User not authenticated" 
            });
        }

        const userId = req.user.id;

        const { data, error } = await supabase
            .from("tasks")
            .select("*")
            .eq("id", id)
            .eq("user_id", userId)
            .single();

        if (error) {
            console.error('❌ Supabase error:', error);
            return res.status(404).json({ 
                success: false,
                error: "Task not found" 
            });
        }

        res.json({ 
            success: true, 
            data 
        });
    } catch (err) {
        console.error('💥 Server error:', err);
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
};

// Toggle task completion status
export const toggleTaskComplete = async (req, res) => {
    try {
        const { id } = req.params;
        const { completed } = req.body;
        
        if (!req.user || !req.user.id) {
            return res.status(401).json({ 
                success: false,
                error: "User not authenticated" 
            });
        }

        const userId = req.user.id;

        // Validate completed is a boolean
        if (typeof completed !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: "Completed must be a boolean value"
            });
        }

        console.log(`📝 Toggling task ${id} completion to ${completed}`);

        // First, verify the task belongs to the user
        const { data: taskData, error: fetchError } = await supabase
            .from("tasks")
            .select("*")
            .eq("id", id)
            .eq("user_id", userId)
            .single();

        if (fetchError || !taskData) {
            return res.status(404).json({ 
                success: false,
                error: "Task not found" 
            });
        }

        // Update the task
        const { data, error } = await supabase
            .from("tasks")
            .update({ completed })
            .eq("id", id)
            .eq("user_id", userId)
            .select();

        if (error) {
            console.error('❌ Supabase error:', error);
            return res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }

        console.log('✅ Task updated:', data);

        res.json({ 
            success: true, 
            message: `Task marked as ${completed ? 'completed' : 'pending'}`,
            data: data[0] 
        });
    } catch (err) {
        console.error('💥 Server error:', err);
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
};

// Update task
export const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { task_name, description, task_date, task_time, goal } = req.body;
        
        if (!req.user || !req.user.id) {
            return res.status(401).json({ 
                success: false,
                error: "User not authenticated" 
            });
        }

        const userId = req.user.id;

        // First, verify the task belongs to the user
        const { data: taskData, error: fetchError } = await supabase
            .from("tasks")
            .select("*")
            .eq("id", id)
            .eq("user_id", userId)
            .single();

        if (fetchError || !taskData) {
            return res.status(404).json({ 
                success: false,
                error: "Task not found" 
            });
        }

        // Build update object with only provided fields
        const updateData = {};
        if (task_name !== undefined) updateData.task_name = task_name.trim();
        if (description !== undefined) updateData.description = description?.trim() || null;
        if (task_date !== undefined) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(task_date)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid date format. Please use YYYY-MM-DD"
                });
            }
            updateData.task_date = task_date;
        }
        if (task_time !== undefined) {
            const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(task_time)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid time format. Please use HH:MM (24-hour format)"
                });
            }
            updateData.task_time = task_time;
        }
        if (goal !== undefined) updateData.goal = goal?.trim() || null;

        console.log(`📝 Updating task ${id}`);

        const { data, error } = await supabase
            .from("tasks")
            .update(updateData)
            .eq("id", id)
            .eq("user_id", userId)
            .select();

        if (error) {
            console.error('❌ Supabase error:', error);
            return res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }

        console.log('✅ Task updated:', data);

        res.json({ 
            success: true, 
            message: "Task updated successfully",
            data: data[0] 
        });
    } catch (err) {
        console.error('💥 Server error:', err);
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
};

// Delete task
export const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!req.user || !req.user.id) {
            return res.status(401).json({ 
                success: false,
                error: "User not authenticated" 
            });
        }

        const userId = req.user.id;

        console.log(`🗑️ Deleting task ${id} for user ${userId}`);

        // First, verify the task belongs to the user
        const { data: taskData, error: fetchError } = await supabase
            .from("tasks")
            .select("*")
            .eq("id", id)
            .eq("user_id", userId)
            .single();

        if (fetchError || !taskData) {
            return res.status(404).json({ 
                success: false,
                error: "Task not found" 
            });
        }

        // Delete the task
        const { error } = await supabase
            .from("tasks")
            .delete()
            .eq("id", id)
            .eq("user_id", userId);

        if (error) {
            console.error('❌ Supabase error:', error);
            return res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }

        console.log('✅ Task deleted successfully');

        res.json({ 
            success: true, 
            message: "Task deleted successfully" 
        });
    } catch (err) {
        console.error('💥 Server error:', err);
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
};

