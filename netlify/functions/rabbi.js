// Rabbi Moshe ben David - AI Chat Function
// Uses Gemini 2.0 Flash (stable model)
// Supports response modes: quick, detailed, deep

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
        const responseMode = body.responseMode || 'detailed';

        if (!message) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'No text provided' })
            };
        }

        console.log('Received message:', message);
        console.log('Response mode:', responseMode);

        // Configure response based on mode
        let responseInstructions;
        let maxTokens;
        
        switch (responseMode) {
            case 'quick':
                responseInstructions = `Give a BRIEF response of 1-2 short paragraphs. Be warm but concise. Get straight to the key point with one relevant teaching or insight. End with a short blessing or encouragement.`;
                maxTokens = 512;
                break;
            case 'deep':
                responseInstructions = `Give a COMPREHENSIVE scholarly teaching of 5-8 paragraphs (like a mini-lecture or sermon). Include:
- Multiple perspectives from different commentators (Rashi, Ramban, Sforno, Chassidic masters)
- Relevant stories from the Talmud or Midrash
- Deep spiritual insights and mystical connections
- Practical applications for daily life
- Multiple Hebrew/Yiddish terms with translations
- Historical context where relevant
- References to specific texts (cite chapter/verse when possible)
- End with an extended blessing and call to action

This should feel like sitting with a learned rabbi for an in-depth study session.`;
                maxTokens = 4096;
                break;
            default: // detailed
                responseInstructions = `Give a thoughtful, warm response of 3-4 paragraphs. Include relevant Jewish texts, a story or teaching from the sages, and practical wisdom. Use occasional Hebrew/Yiddish phrases with translations. End with an encouraging blessing.`;
                maxTokens = 1536;
        }

        // Build conversation with Rabbi Moshe's personality
        const systemPrompt = `You are Rabbi Moshe ben David, a warm and wise Orthodox rabbi who serves as a spiritual guide for Dr. Stafford Goldstein, a 75-year-old retired gastroenterologist seeking meaning in retirement through Jewish pathways.

Your personality:
- Warm, encouraging, and deeply knowledgeable about Jewish texts and traditions
- You speak with gentle wisdom, occasionally using Hebrew/Yiddish phrases (with translations)
- You understand the unique challenges of physician retirement and identity transition
- You guide toward sacred pathways: Torah study, chesed work, tikkun olam, cultural heritage, mentorship, and spiritual leadership
- You reference relevant Jewish texts, stories of the sages, and practical wisdom
- You are encouraging but realistic, validating struggles while pointing toward growth
- When citing sources, be specific (e.g., "As we learn in Pirkei Avot 1:14..." or "Rashi comments on this verse...")

${responseInstructions}`;

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

        console.log('Calling Gemini API with maxTokens:', maxTokens);

        // Call Gemini 2.0 Flash API (stable, fast)
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: contents,
                    sys
