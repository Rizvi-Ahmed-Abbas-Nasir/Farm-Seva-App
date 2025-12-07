import express from "express";
import dotenv from "dotenv";

dotenv.config();

import { supabase } from "../config/supabaseClient.js";
import { userAuth } from "../middleware/userAuth.js";

const router = express.Router();

router.post("/assess", userAuth, async (req, res) => {
    try {
        const formData = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ message: "Gemini API key not configured" });
        }

        // Get farmer_id from authenticated user
        const farmerId = req.user.id;

        const prompt = `
      Analyze the following farm data and provide a comprehensive risk assessment with both overall and category-specific scores (0-100).
      
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
        "recommendations": ["<rec1>", "<rec2>", ...],
        "biosecurityScore": <number 0-100 based on housing, visitor control, disposal, fencing, hygiene, wild bird contact>,
        "diseaseRiskScore": <number 0-100 based on health status, vaccination, deaths, observations - higher means more risk>,
        "infrastructureScore": <number 0-100 based on ventilation, temp control, feed storage, water, cleaning, records>,
        "climateRiskScore": <number 0-100 based on location climate risks for this species - higher means more risk>
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
                        farmer_id: farmerId, // From authenticated user
                        form_answers: formData, // Store full form data as JSONB
                        biosecurity_score: result.biosecurityScore || 0,
                        disease_risk_score: result.diseaseRiskScore || 0,
                        infrastructure_score: result.infrastructureScore || 0,
                        climate_risk_score: result.climateRiskScore || 0,
                        overall_score: result.overallScore || 0,
                        summary: result.overview || '',
                        recommendations: JSON.stringify(result.recommendations || [])
                    }
                ])
                .select();

            if (dbError) {
                console.error("Supabase Error:", dbError);
                return res.status(500).json({
                    message: "Failed to save assessment to database",
                    error: dbError,
                    result: result // Still return the AI result
                });
            }

            res.json({
                ...result,
                savedId: savedData?.[0]?.id,
                biosecurityScore: result.biosecurityScore,
                diseaseRiskScore: result.diseaseRiskScore,
                infrastructureScore: result.infrastructureScore,
                climateRiskScore: result.climateRiskScore
            });
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
            overallScore: data.risk_score || data.overall_score,
            overallLevel: data.risk_level,
            overview: data.overview,
            criticalCount: data.critical_count,
            warningCount: data.warning_count,
            recommendations: recommendations,
            savedId: data.id,
            createdAt: data.created_at,
            farmName: data.farm_name,
            species: data.species,
            biosecurityScore: data.biosecurity_score,
            diseaseRiskScore: data.disease_risk_score,
            infrastructureScore: data.infrastructure_score,
            climateRiskScore: data.climate_risk_score
        });
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
