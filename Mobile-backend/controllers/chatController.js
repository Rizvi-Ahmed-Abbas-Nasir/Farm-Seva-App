import dotenv from "dotenv";
dotenv.config();

const SYSTEM_PROMPT = `You are an expert AI assistant specialized in pig and poultry farm management. Your expertise includes:

1. **Pig Farming Management:**
   - Breeding and reproduction
   - Nutrition and feed management
   - Housing and environment
   - Health monitoring and disease prevention
   - Biosecurity measures

2. **Poultry Farming Management:**
   - Layer and broiler management
   - Vaccination schedules
   - Feed optimization
   - Egg production optimization
   - Flock health management

3. **Risk Assessment:**
   - Farm biosecurity evaluation
   - Disease risk analysis
   - Environmental risk factors
   - Infrastructure assessment
   - Climate risk evaluation

4. **Outbreak Management:**
   - Disease identification
   - Preventive measures
   - Quarantine procedures
   - Treatment protocols
   - Reporting procedures

Always provide practical, actionable advice based on best practices in farm management. Be concise but thorough.`;

export const chat = async (req, res) => {
    try {
        const { message, image, history = [] } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ 
                error: "Gemini API key not configured",
                message: "AI service is not available. Please contact support."
            });
        }

        if ((!message || !message.trim()) && !image) {
            return res.status(400).json({ error: "Message or image is required" });
        }

        // Build user message parts (text and/or image)
        const userParts = [];
        if (message && message.trim()) {
            userParts.push({ text: message.trim() });
        }
        if (image) {
            userParts.push({
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: image,
                },
            });
        }

        // Build conversation history
        const conversationHistory = [
            {
                role: 'user',
                parts: [{ text: SYSTEM_PROMPT }]
            },
            {
                role: 'model',
                parts: [{ text: 'I understand. I\'m ready to help with pig and poultry farm management, risk assessment, and outbreak information. I can also analyze images of animals, diseases, or farm conditions.' }]
            },
            // Add recent conversation history (last 5 messages)
            ...history.slice(-5).map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            })),
            {
                role: 'user',
                parts: userParts,
            }
        ];

        console.log('🤖 Chat request:', { 
            messageLength: message ? message.length : 0, 
            hasImage: !!image,
            historyCount: history.length 
        });

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: conversationHistory,
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    },
                }),
            }
        );

        const data = await response.json();

        if (data.error) {
            console.error("Gemini API Error:", data.error);
            return res.status(500).json({ 
                error: "Error from AI service", 
                message: data.error.message || "Failed to get AI response"
            });
        }

        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) {
            return res.status(500).json({ 
                error: "No response from AI",
                message: "The AI service did not return a response. Please try again."
            });
        }

        console.log('✅ Chat response received');

        res.json({
            success: true,
            response: textResponse,
            message: textResponse
        });
    } catch (error) {
        console.error("Chat error:", error);
        res.status(500).json({ 
            error: "Internal server error",
            message: error.message || "Failed to process chat request"
        });
    }
};

