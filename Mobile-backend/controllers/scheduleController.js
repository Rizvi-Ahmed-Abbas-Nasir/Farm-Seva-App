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

// Generate vaccination schedule for an animal
export const generateVaccinationSchedule = async (req, res) => {
    try {
        const userId = req.user.id;
        const { animalType, birthDate, breed } = req.body;

        console.log('📅 Generating vaccination schedule:', { userId, animalType, birthDate, breed });

        // Validation
        if (!animalType || !birthDate) {
            return res.status(400).json({
                error: "Animal type and birth date are required"
            });
        }

        // Validate date
        const parsedBirthDate = new Date(birthDate);
        if (isNaN(parsedBirthDate.getTime())) {
            return res.status(400).json({ error: "Invalid birth date format" });
        }

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

        // Generate vaccination records
        const vaccinations = scheduleTemplate.map(template => {
            const scheduledDate = calculateVaccinationDate(parsedBirthDate, template.age_days);

            return {
                user_id: userId,
                species: species,
                vaccine_name: template.vaccine_name,
                scheduled_date: scheduledDate,
                administration_method: template.administration_method || '',
                notes: `${template.purpose} - ${template.notes}`,
                schedule_type: 'auto',
                animal_age_days: template.age_days,
                status: null // pending
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

            // Generate multiple instances based on frequency
            while (currentDate <= threeMonthsLater) {
                checkups.push({
                    user_id: userId,
                    species: species,
                    animal_name: animalName || `${species.charAt(0).toUpperCase() + species.slice(1)} Health Check`,
                    scheduled_date: currentDate.toISOString(),
                    administration: template.type,
                    notes: `${template.checks.join(', ')} - ${template.notes}`,
                    schedule_type: 'auto',
                    frequency: template.frequency,
                    is_recurring: true,
                    status: null
                });

                // Calculate next occurrence
                currentDate = new Date(calculateNextCheckupDate(currentDate, template.frequency));

                // Limit daily/weekly to avoid too many records
                if (template.frequency === 'daily' && checkups.length > 90) break;
                if (template.frequency === 'weekly' && checkups.length > 12) break;
            }
        });

        // Limit total checkups to prevent overwhelming
        const limitedCheckups = checkups.slice(0, 50);

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

        // Check existing checkups
        const { data: checkups } = await supabase
            .from("animal_checkup")
            .select("species, schedule_type")
            .eq("user_id", userId);

        const recommendations = [];

        // Analyze and recommend
        const hasAutoVaccinations = vaccinations?.some(v => v.schedule_type === 'auto');
        const hasAutoCheckups = checkups?.some(c => c.schedule_type === 'auto');

        if (!hasAutoVaccinations) {
            recommendations.push({
                type: 'vaccination',
                title: 'Set up Auto Vaccination Schedule',
                description: 'Generate ideal vaccination schedules for your animals based on veterinary best practices',
                action: 'generate_vaccination_schedule'
            });
        }

        if (!hasAutoCheckups) {
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
                auto_vaccinations: vaccinations?.filter(v => v.schedule_type === 'auto').length || 0,
                auto_checkups: checkups?.filter(c => c.schedule_type === 'auto').length || 0
            }
        });

    } catch (err) {
        console.error('💥 Server error:', err);
        res.status(500).json({ error: "Server error: " + err.message });
    }
};
