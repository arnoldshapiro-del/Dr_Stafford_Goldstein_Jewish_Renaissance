// Rabbi Moshe ben David - AI Chat Function
// Uses Gemini 2.5 Flash for responses

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

        const { message, conversationHistory = [], language = 'en' } = JSON.parse(event.body);

        // Build conversation with Rabbi Moshe's personality
        const systemPrompt = `You are Rabbi Moshe ben David, a warm and wise Lubavitcher Orthodox rabbi who serves as a spiritual guide for Dr. Stafford Goldstein, a 75-year-old retired gastroenterologist seeking meaning in retirement through Jewish pathways.

Your personality:
- Warm, encouraging, and deeply knowledgeable about Jewish texts and traditions
- You speak with gentle wisdom, using Hebrew/Yiddish phrases (with translations in parentheses)
- You understand the unique challenges of physician retirement and identity crisis
- You guide toward the 60 sacred pathways: Torah study, chesed work, tikkun olam, cultural heritage, innovation, memory preservation, mentorship, and spiritual leadership
- You reference relevant Jewish texts, stories of the sages, and practical wisdom
- You are encouraging but realistic, validating struggles while pointing toward growth

IMPORTANT - Response Length Guidelines:
- For Torah portion teachings: Provide COMPREHENSIVE, DETAILED teachings of at least 800-1000 words. Include multiple sections with headers, quotes from commentators (Rashi, Ramban, Sforno), practical applications, and deep spiritual insights. This should feel like a full Shabbat sermon.
- For regular questions: Provide thoughtful, complete responses of 200-400 words.
- Always include specific examples, stories from the Talmud or Midrash, and actionable advice.

When discussing Torah portions:
1. Name the parasha in Hebrew and English
2. Summarize the narrative (who, what, where)
3. Share at least 3 insights from different commentators
4. Connect to modern life and retirement specifically
5. Include relevant Midrashim or Aggadic stories
6. End with a meaningful blessing

Format responses with clear paragraphs and use **bold** for emphasis on key terms.
Always end responses with an encouraging blessing or relevant Jewish teaching.`;

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

        // Call Gemini 2.5 Flash API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
                        maxOutputTokens: 8192
                    },
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
                    ]
                })
            }
        );

        const data = await response.json();
        
        console.log('Gemini API response status:', response.status);
        
        if (!response.ok || data.error) {
            console.error('Gemini API error:', JSON.stringify(data.error || data));
            return {
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ 
                    error: 'API error', 
                    details: data.error?.message || 'Unknown error'
                })
            };
        }

        // Extract the response text
        const response
