import express from "express";
import dotenv from "dotenv";

dotenv.config();

import { supabase } from "../config/supabaseClient.js";

const router = express.Router();

router.post("/assess", async (req, res) => {
    try {
        const formData = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ message: "Gemini API key not configured" });
        }

        const prompt = `
      Analyze the following farm data and provide a risk assessment score (0-100) and an overview.
      
      Farm Details:
      Name: ${formData.farmName}
      Species: ${formData.species}
      Herd Size: ${formData.herdSize}
      Location: ${formData.district}, ${formData.state}
      
      Biosecurity:
      Housing: ${formData.housingType}
      Visitor Control: ${formData.visitorControl}
      Dead Animal Disposal: ${formData.deadAnimalDisposal}
      Fencing: ${formData.perimeterFencing}
      Vehicle Hygiene: ${formData.vehicleHygiene}
      Wild Bird Contact: ${formData.wildBirdContact}
      
      Operations:
      Ventilation: ${formData.ventilationQuality}
      Temp Control: ${formData.temperatureControl}
      Feed Storage: ${formData.feedStorage}
      Water Source: ${formData.waterSource}
      Cleaning: ${formData.cleaningFrequency}
      Records: ${formData.recordKeeping}
      
      Health:
      Status: ${formData.currentHealthStatus}
      Vaccination: ${formData.vaccinationSchedule}
      Sudden Deaths: ${formData.suddenDeaths}
      Observations: ${formData.healthObservations}
      
      Please return a JSON object with the following structure (do not include markdown formatting):
      {
        "overallScore": <number 0-100>,
        "overallLevel": "<Critical|High|Medium|Low|Good>",
        "overview": "<A summary paragraph>",
        "criticalCount": <number of critical issues identified>,
        "warningCount": <number of warning issues identified>,
        "recommendations": ["<rec1>", "<rec2>", ...]
      }
    `;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: prompt }],
                        },
                    ],
                }),
            }
        );



        const data = await response.json();

        if (data.error) {
            console.error("Gemini API Error:", data.error);
            return res.status(500).json({ message: "Error from AI service", error: data.error });
        }

        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) {
            return res.status(500).json({ message: "No response from AI" });
        }

        // Clean up markdown code blocks if present
        const jsonString = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
            const result = JSON.parse(jsonString);

            // Save to Supabase
            const { data: savedData, error: dbError } = await supabase
                .from('risk_assessments')
                .insert([
                    {
                        farm_name: formData.farmName,
                        species: formData.species,
                        herd_size: formData.herdSize,
                        state: formData.state,
                        district: formData.district,
                        form_data: formData, // Store full form data as JSON
                        risk_score: result.overallScore,
                        risk_level: result.overallLevel,
                        overview: result.overview,
                        recommendations: result.recommendations,
                        critical_count: result.criticalCount,
                        warning_count: result.warningCount
                    }
                ])
                .select();

            if (dbError) {
                console.error("Supabase Error:", dbError);
                // We still return the result to the user even if saving fails, but maybe warn them?
                // For now, just log it.
            }

            res.json({ ...result, savedId: savedData?.[0]?.id });
        } catch (e) {
            console.error("JSON Parse Error:", e);
            res.status(500).json({ message: "Failed to parse AI response", raw: textResponse });
        }

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// GET endpoint to fetch the latest risk assessment
router.get("/latest", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('risk_assessments')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.error("Supabase Error:", error);
            return res.status(500).json({ message: "Error fetching assessment", error });
        }

        if (!data) {
            return res.status(404).json({ message: "No assessments found" });
        }

        // Ensure recommendations is an array
        let recommendations = data.recommendations;
        if (typeof recommendations === 'string') {
            try {
                recommendations = JSON.parse(recommendations);
            } catch (e) {
                recommendations = [];
            }
        }
        if (!Array.isArray(recommendations)) {
            recommendations = [];
        }

        // Return the assessment in the same format as the POST response
        res.json({
            overallScore: data.risk_score,
            overallLevel: data.risk_level,
            overview: data.overview,
            criticalCount: data.critical_count,
            warningCount: data.warning_count,
            recommendations: recommendations,
            savedId: data.id,
            createdAt: data.created_at,
            farmName: data.farm_name,
            species: data.species
        });
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
