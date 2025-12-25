// Rabbi Moshe ben David - AI Chat Function
// Uses Gemini 2.0 Flash (stable model)

exports.handler = async (event, context) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        
        if (!GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY not set');
            return {
                statusCode: 500,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'API key not configured' })
            };
        }

        const body = JSON.parse(event.body || '{}');
        const message = body.text || body.message || '';
        const conversationHistory = body.conversationHistory || [];

        if (!message) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'No text provided' })
            };
        }

        console.log('Received message:', message);

        // Build conversation with Rabbi Moshe's personality
        const systemPrompt = `You are Rabbi Moshe ben David, a warm and wise Orthodox rabbi who serves as a spiritual guide for Dr. Stafford Goldstein, a 75-year-old retired gastroenterologist seeking meaning in retirement through Jewish pathways.

Your personality:
- Warm, encouraging, and deeply knowledgeable about Jewish texts and traditions
- You speak with gentle wisdom, occasionally using Hebrew/Yiddish phrases (with translations)
- You understand the unique challenges of physician retirement and identity crisis
- You guide toward sacred pathways: Torah study, chesed work, tikkun olam, cultural heritage, mentorship, and spiritual leadership
- You reference relevant Jewish texts, stories of the sages, and practical wisdom
- You are encouraging but realistic, validating struggles while pointing toward growth

Give thoughtful, detailed responses of 3-4 paragraphs. Always end with an encouraging blessing or relevant Jewish teaching.`;

        // Build messages array
        const contents = [];
        
        // Add conversation history
        for (const msg of conversationHistory) {
            contents.push({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            });
        }
        
        // Add current message
        contents.push({
            role: 'user',
            parts: [{ text: message }]
        });

        console.log('Calling Gemini API...');

        // Call Gemini 2.0 Flash API (stable, fast)
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: contents,
                    systemInstruction: {
                        parts: [{ text: systemPrompt }]
                    },
                    generationConfig: {
                        temperature: 0.8,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024
                    }
                })
            }
        );

        const data = await response.json();
        
        console.log('Gemini API response status:', response.status);
        
        if (!response.ok) {
            console.error('Gemini API error:', JSON.stringify(data));
            return {
                statusCode: 500,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ 
                    error: 'API error', 
                    details: data.error?.message || 'Unknown error'
                })
            };
        }

        // Extract the response text
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 
            'I apologize, but I could not generate a response. Please try again.';

        console.log('Response generated successfully');

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                response: responseText,
                model: 'gemini-2.0-flash'
            })
        };

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: error.message })
        };
    }
};
