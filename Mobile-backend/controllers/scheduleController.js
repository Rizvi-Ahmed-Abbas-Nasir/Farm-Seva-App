import { supabase } from "../config/supabaseClient.js";
import {
    PIG_VACCINATION_SCHEDULE,
    POULTRY_BROILER_SCHEDULE,
    POULTRY_LAYER_CHICK_SCHEDULE,
    POULTRY_LAYER_GROWER_SCHEDULE,
    POULTRY_LAYER_PRODUCTION_SCHEDULE,
    PIG_CHECKUP_SCHEDULE,
    POULTRY_CHECKUP_SCHEDULE,
    calculateVaccinationDate,
    calculateNextCheckupDate
} from "../config/scheduleTemplates.js";

export const generateVaccinationSchedule = async (req, res) => {
    try {
        const userId = req.user.id;
        const { animalType, animal_age_days, breed, birthDate } = req.body;

        console.log('📅 Generating vaccination schedule:', { userId, animalType, animal_age_days, breed, birthDate });

        // Validation - accept either birthDate or animal_age_days
        if (!animalType) {
            return res.status(400).json({
                error: "Animal type is required"
            });
        }

        let ageInDays;
        
        // If birthDate is provided, calculate age in days
        if (birthDate) {
            const parsedBirthDate = new Date(birthDate);
            if (isNaN(parsedBirthDate.getTime())) {
                return res.status(400).json({ error: "Invalid birth date format" });
            }
            
            const today = new Date();
            ageInDays = Math.floor((today - parsedBirthDate) / (1000 * 60 * 60 * 24));
        } 
        // If animal_age_days is provided directly
        else if (animal_age_days) {
            ageInDays = parseInt(animal_age_days);
            if (isNaN(ageInDays)) {
                return res.status(400).json({ error: "Invalid animal age. Please provide a number." });
            }
        }
        // Neither provided
        else {
            return res.status(400).json({
                error: "Either birth date or animal age (in days) is required"
            });
        }

        // Ensure age is not negative
        if (ageInDays < 0) {
            return res.status(400).json({ error: "Birth date cannot be in the future" });
        }

        console.log(`📊 Animal age in days: ${ageInDays}`);

        let scheduleTemplate = [];
        let species = animalType.toLowerCase();

        // Select appropriate schedule template
        if (species === 'pig' || species === 'swine') {
            scheduleTemplate = PIG_VACCINATION_SCHEDULE;
            species = 'pig';
        } else if (species === 'poultry' || species === 'chicken') {
            if (breed === 'broiler') {
                scheduleTemplate = POULTRY_BROILER_SCHEDULE;
            } else if (breed === 'layer') {
                // Combine all layer schedules
                scheduleTemplate = [
                    ...POULTRY_LAYER_CHICK_SCHEDULE,
                    ...POULTRY_LAYER_GROWER_SCHEDULE
                ];
            } else {
                // Default to broiler for short-term
                scheduleTemplate = POULTRY_BROILER_SCHEDULE;
            }
            species = 'poultry';
        } else {
            return res.status(400).json({
                error: "Unsupported animal type. Use 'pig' or 'poultry'"
            });
        }

        // Filter vaccinations based on current age
        const applicableVaccinations = scheduleTemplate.filter(vaccine => {
            // Only include vaccines that should be given at or after current age
            return vaccine.age_days >= ageInDays;
        });

        if (applicableVaccinations.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No vaccinations needed at this age",
                data: []
            });
        }

        // Generate vaccination records
        const vaccinations = applicableVaccinations.map(template => {
            // Calculate days from now until this vaccine should be given
            const daysFromNow = template.age_days - ageInDays;
            const scheduledDate = new Date();
            scheduledDate.setDate(scheduledDate.getDate() + daysFromNow);

            return {
                user_id: userId,
                species: species,
                vaccine_name: template.vaccine_name,
                scheduled_date: scheduledDate.toISOString().split('T')[0],
                administration_method: template.administration_method || '',
                notes: `${template.purpose} - ${template.notes}`,
                schedule_type: 'auto',
                animal_age_days: template.age_days,
                status: 'pending'
            };
        });

        // Insert all vaccinations
        const { data, error } = await supabase
            .from("vaccination_schedules")
            .insert(vaccinations)
            .select();

        if (error) {
            console.error('❌ Supabase error:', error);
            return res.status(400).json({ error: error.message });
        }

        console.log(`✅ Generated ${data.length} vaccinations for ${species}`);

        res.status(201).json({
            success: true,
            message: `Generated ${data.length} vaccination schedules`,
            count: data.length,
            animal_age_days: ageInDays, // Return current age in response
            data: data
        });

    } catch (err) {
        console.error('💥 Server error:', err);
        res.status(500).json({ error: "Server error: " + err.message });
    }
};


// Generate checkup schedule for an animal
export const generateCheckupSchedule = async (req, res) => {
    try {
        const userId = req.user.id;
        const { animalType, startDate, animalName } = req.body;

        console.log('📅 Generating checkup schedule:', { userId, animalType, startDate, animalName });

        // Validation
        if (!animalType || !startDate) {
            return res.status(400).json({
                error: "Animal type and start date are required"
            });
        }

        const parsedStartDate = new Date(startDate);
        if (isNaN(parsedStartDate.getTime())) {
            return res.status(400).json({ error: "Invalid start date format" });
        }

        let scheduleTemplate = [];
        let species = animalType.toLowerCase();

        // Select appropriate checkup schedule
        if (species === 'pig' || species === 'swine') {
            scheduleTemplate = PIG_CHECKUP_SCHEDULE;
            species = 'pig';
        } else if (species === 'poultry' || species === 'chicken') {
            scheduleTemplate = POULTRY_CHECKUP_SCHEDULE;
            species = 'poultry';
        } else {
            return res.status(400).json({
                error: "Unsupported animal type. Use 'pig' or 'poultry'"
            });
        }

        // Generate checkup records (next 3 months of recurring checkups)
        const checkups = [];
        const threeMonthsLater = new Date(parsedStartDate);
        threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

        scheduleTemplate.forEach(template => {
            let currentDate = new Date(parsedStartDate);
            let count = 0;

            // Generate multiple instances based on frequency
            while (currentDate <= threeMonthsLater && count < 12) {
                checkups.push({
                    user_id: userId,
                    species: species,
                    animal_name: animalName || `${species.charAt(0).toUpperCase() + species.slice(1)} Health Check`,
                    scheduled_date: currentDate.toISOString().split('T')[0], // YYYY-MM-DD format
                    administration: template.type,
                    notes: `${template.checks?.join(', ') || ''} - ${template.notes || ''}`.trim()
                    // Removed: schedule_type, frequency, is_recurring
                });

                // Calculate next occurrence
                currentDate = new Date(currentDate);
                if (template.frequency === 'daily') {
                    currentDate.setDate(currentDate.getDate() + 1);
                } else if (template.frequency === 'weekly') {
                    currentDate.setDate(currentDate.getDate() + 7);
                } else if (template.frequency === 'monthly') {
                    currentDate.setMonth(currentDate.getMonth() + 1);
                } else {
                    currentDate.setDate(currentDate.getDate() + 7);
                }

                count++;
            }
        });

        // Limit total checkups
        const limitedCheckups = checkups.slice(0, 30);

        if (limitedCheckups.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No checkups generated based on the schedule",
                count: 0,
                data: []
            });
        }

        // Insert checkups
        const { data, error } = await supabase
            .from("animal_checkup")
            .insert(limitedCheckups)
            .select();

        if (error) {
            console.error('❌ Supabase error:', error);
            return res.status(400).json({ error: error.message });
        }

        console.log(`✅ Generated ${data.length} checkups for ${species}`);

        res.status(201).json({
            success: true,
            message: `Generated ${data.length} checkup schedules`,
            count: data.length,
            data: data
        });

    } catch (err) {
        console.error('💥 Server error:', err);
        res.status(500).json({ error: "Server error: " + err.message });
    }
};

// Get schedule recommendations based on existing data
export const getScheduleRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;

        // Check existing vaccinations
        const { data: vaccinations } = await supabase
            .from("vaccination_schedules")
            .select("species, schedule_type")
            .eq("user_id", userId);

        // Check existing checkups - remove schedule_type filter
        const { data: checkups } = await supabase
            .from("animal_checkup")
            .select("species")
            .eq("user_id", userId);

        const recommendations = [];

        // Analyze and recommend
        const hasAutoVaccinations = vaccinations?.some(v => v.schedule_type === 'auto');
        const hasCheckups = checkups && checkups.length > 0;

        if (!hasAutoVaccinations) {
            recommendations.push({
                type: 'vaccination',
                title: 'Set up Auto Vaccination Schedule',
                description: 'Generate ideal vaccination schedules for your animals based on veterinary best practices',
                action: 'generate_vaccination_schedule'
            });
        }

        if (!hasCheckups) {
            recommendations.push({
                type: 'checkup',
                title: 'Set up Health Checkup Schedule',
                description: 'Create recurring health checkup reminders (daily, weekly, monthly)',
                action: 'generate_checkup_schedule'
            });
        }

        // Check for upcoming vaccinations
        const upcomingCount = vaccinations?.filter(v => {
            const date = new Date(v.scheduled_date);
            const now = new Date();
            return date > now && v.status !== 'done';
        }).length || 0;

        if (upcomingCount === 0 && vaccinations?.length > 0) {
            recommendations.push({
                type: 'alert',
                title: 'No Upcoming Vaccinations',
                description: 'Consider adding new vaccination schedules for your animals',
                action: 'add_vaccination'
            });
        }

        res.json({
            success: true,
            recommendations,
            stats: {
                total_vaccinations: vaccinations?.length || 0,
                total_checkups: checkups?.length || 0,
                auto_vaccinations: vaccinations?.filter(v => v.schedule_type === 'auto').length || 0
            }
        });

    } catch (err) {
        console.error('💥 Server error:', err);
        res.status(500).json({ error: "Server error: " + err.message });
    }
};