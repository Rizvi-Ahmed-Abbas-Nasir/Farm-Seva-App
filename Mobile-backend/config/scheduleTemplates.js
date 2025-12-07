// Vaccination and Health Checkup Schedule Templates
// Based on ideal veterinary schedules for pigs and poultry

export const PIG_VACCINATION_SCHEDULE = [
    {
        age_days: 3,
        age_range: '3-5 days',
        vaccine_name: 'Iron Injection',
        purpose: 'Prevent anemia',
        administration_method: 'Injection',
        notes: 'Critical for piglet health'
    },
    {
        age_days: 5,
        age_range: '5 days',
        vaccine_name: 'Vitamin & Mineral Supplement',
        purpose: 'Boost immunity and growth',
        administration_method: 'Oral/Injection',
        notes: 'Early health support'
    },
    {
        age_days: 14,
        age_range: '2 weeks',
        vaccine_name: 'Mycoplasma hyopneumoniae',
        purpose: 'Reduce pneumonia',
        administration_method: 'Injection',
        notes: 'Respiratory health protection'
    },
    {
        age_days: 21,
        age_range: '3 weeks (weaning)',
        vaccine_name: 'Circovirus (PCV2)',
        purpose: 'Growth + immunity',
        administration_method: 'Injection',
        notes: 'Important at weaning time'
    },
    {
        age_days: 28,
        age_range: '4 weeks',
        vaccine_name: 'E. coli, Clostridium',
        purpose: 'Reduce diarrhea',
        administration_method: 'Injection',
        notes: 'Digestive health protection'
    },
    {
        age_days: 42,
        age_range: '6 weeks',
        vaccine_name: 'PRRS',
        purpose: 'Viral protection',
        administration_method: 'Injection',
        notes: 'If needed based on farm conditions'
    },
    {
        age_days: 56,
        age_range: '8 weeks',
        vaccine_name: 'Swine Fever (Classical)',
        purpose: 'Major disease prevention',
        administration_method: 'Injection',
        notes: 'Critical vaccination'
    }
];

export const POULTRY_BROILER_SCHEDULE = [
    {
        age_days: 1,
        age_range: 'Day 1',
        vaccine_name: "Marek's Disease",
        purpose: 'Viral disease prevention',
        administration_method: 'Injection',
        notes: 'Usually given at hatchery'
    },
    {
        age_days: 5,
        age_range: 'Day 5',
        vaccine_name: 'Vitamin Supplement',
        purpose: 'Early immunity boost',
        administration_method: 'Drinking water',
        notes: 'Supports early development'
    },
    {
        age_days: 6,
        age_range: 'Day 5-7',
        vaccine_name: 'Newcastle + Infectious Bronchitis (IB)',
        purpose: 'Respiratory protection',
        administration_method: 'Eye drop/Spray',
        notes: 'Combined vaccine'
    },
    {
        age_days: 12,
        age_range: 'Day 10-14',
        vaccine_name: 'Gumboro (IBD)',
        purpose: 'Immune system protection',
        administration_method: 'Drinking water',
        notes: 'Critical for immunity'
    },
    {
        age_days: 20,
        age_range: 'Day 18-21',
        vaccine_name: 'Booster – Newcastle/IB',
        purpose: 'Strengthen immunity',
        administration_method: 'Eye drop/Spray',
        notes: 'Booster dose'
    },
    {
        age_days: 15,
        age_range: 'Optional',
        vaccine_name: 'Coccidiosis',
        purpose: 'Parasite prevention',
        administration_method: 'Drinking water',
        notes: 'Depends on farm conditions'
    }
];

export const POULTRY_LAYER_CHICK_SCHEDULE = [
    {
        age_days: 1,
        age_range: 'Day 1',
        vaccine_name: "Marek's Disease",
        purpose: 'Viral disease prevention',
        administration_method: 'Injection',
        notes: 'Usually given at hatchery'
    },
    {
        age_days: 5,
        age_range: 'Day 5',
        vaccine_name: 'Vitamin Supplement',
        purpose: 'Early immunity boost',
        administration_method: 'Drinking water',
        notes: 'Supports early development'
    },
    {
        age_days: 6,
        age_range: 'Day 5-7',
        vaccine_name: 'Newcastle + IB',
        purpose: 'Respiratory protection',
        administration_method: 'Eye drop/Spray',
        notes: 'Combined vaccine'
    },
    {
        age_days: 12,
        age_range: 'Day 10-14',
        vaccine_name: 'Gumboro (IBD)',
        purpose: 'Immune system protection',
        administration_method: 'Drinking water',
        notes: 'Critical for immunity'
    },
    {
        age_days: 28,
        age_range: 'Week 4',
        vaccine_name: 'Fowl Pox',
        purpose: 'Pox prevention',
        administration_method: 'Wing web',
        notes: 'Important for layers'
    },
    {
        age_days: 42,
        age_range: 'Week 6',
        vaccine_name: 'AE (Avian Encephalomyelitis)',
        purpose: 'Neurological protection',
        administration_method: 'Drinking water',
        notes: 'Layer-specific'
    },
    {
        age_days: 48,
        age_range: 'Week 6-8',
        vaccine_name: 'ND + IB booster',
        purpose: 'Strengthen immunity',
        administration_method: 'Eye drop/Spray',
        notes: 'Booster dose'
    }
];

export const POULTRY_LAYER_GROWER_SCHEDULE = [
    {
        age_days: 84,
        age_range: 'Week 12',
        vaccine_name: 'Fowl Pox booster',
        purpose: 'Strengthen immunity',
        administration_method: 'Wing web',
        notes: 'Booster dose'
    },
    {
        age_days: 105,
        age_range: 'Week 14-16',
        vaccine_name: 'Inactivated ND + IB vaccine',
        purpose: 'Long-term protection',
        administration_method: 'Injection',
        notes: 'Pre-laying preparation'
    },
    {
        age_days: 119,
        age_range: 'Week 16-18',
        vaccine_name: 'Deworming',
        purpose: 'Parasite control',
        administration_method: 'Oral',
        notes: 'Health maintenance'
    }
];

export const POULTRY_LAYER_PRODUCTION_SCHEDULE = [
    {
        frequency: 'every_60_days',
        vaccine_name: 'Newcastle booster',
        purpose: 'Maintain immunity',
        administration_method: 'Drinking water/Spray',
        notes: 'Every 2-3 months during laying'
    },
    {
        frequency: 'every_90_days',
        vaccine_name: 'Deworming',
        purpose: 'Parasite control',
        administration_method: 'Oral',
        notes: 'Every 3 months'
    },
    {
        frequency: 'as_needed',
        vaccine_name: 'Fowl cholera, E. coli',
        purpose: 'Disease prevention',
        administration_method: 'Injection',
        notes: 'For disease-prone areas'
    }
];

// Health Checkup Schedules
export const PIG_CHECKUP_SCHEDULE = [
    {
        frequency: 'daily',
        type: 'Daily Observation',
        checks: ['Appetite', 'Movement', 'Coughing', 'Diarrhea', 'Injuries'],
        notes: 'Quick visual inspection'
    },
    {
        frequency: 'weekly',
        type: 'Weekly Health Check',
        checks: ['Body condition', 'Skin examination', 'Pen hygiene'],
        notes: 'More detailed inspection'
    },
    {
        frequency: 'monthly',
        type: 'Monthly Full Check',
        checks: ['Weight', 'Respiratory issues', 'Parasite observation'],
        notes: 'Comprehensive health assessment'
    },
    {
        frequency: 'semi_annual',
        type: 'Deworming + Parasite Control',
        checks: ['External parasites (mites, lice)', 'Internal parasites'],
        notes: 'Every 6 months'
    },
    {
        frequency: 'annual',
        type: 'Vet-led Herd Assessment',
        checks: ['Overall herd health', 'Breeding assessment', 'Nutrition review'],
        notes: 'Professional veterinary checkup'
    }
];

export const POULTRY_CHECKUP_SCHEDULE = [
    {
        frequency: 'daily',
        type: 'Daily Observation',
        checks: ['Eating/drinking', 'Droppings', 'Feathers', 'Coughing'],
        notes: 'Quick visual inspection'
    },
    {
        frequency: 'weekly',
        type: 'Weekly Weight Check',
        checks: ['Weight (important for broilers)', 'Litter quality'],
        notes: 'Growth monitoring'
    },
    {
        frequency: 'monthly',
        type: 'Monthly Health Review',
        checks: ['Parasite control', 'Environment assessment'],
        notes: 'Comprehensive check'
    },
    {
        frequency: 'quarterly',
        type: 'Vet Flock Review',
        checks: ['Flock health', 'Production metrics (layers)', 'Disease screening'],
        notes: 'Every 3 months, especially for layers'
    }
];

// Helper function to calculate vaccination date based on birth date
export const calculateVaccinationDate = (birthDate, ageDays) => {
    const date = new Date(birthDate);
    date.setDate(date.getDate() + ageDays);
    return date.toISOString();
};

// Helper function to calculate next checkup date based on frequency
export const calculateNextCheckupDate = (startDate, frequency) => {
    const date = new Date(startDate);

    switch (frequency) {
        case 'daily':
            date.setDate(date.getDate() + 1);
            break;
        case 'weekly':
            date.setDate(date.getDate() + 7);
            break;
        case 'monthly':
            date.setMonth(date.getMonth() + 1);
            break;
        case 'quarterly':
            date.setMonth(date.getMonth() + 3);
            break;
        case 'semi_annual':
            date.setMonth(date.getMonth() + 6);
            break;
        case 'annual':
            date.setFullYear(date.getFullYear() + 1);
            break;
        case 'every_60_days':
            date.setDate(date.getDate() + 60);
            break;
        case 'every_90_days':
            date.setDate(date.getDate() + 90);
            break;
        default:
            date.setDate(date.getDate() + 7);
    }

    return date.toISOString();
};
