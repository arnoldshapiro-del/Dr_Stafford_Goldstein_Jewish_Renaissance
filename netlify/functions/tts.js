// Rabbi Moshe Text-to-Speech Function
// Uses Gemini 2.5 Flash TTS for beautiful, expressive Rabbi voice

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

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY not set');
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'API key not configured' })
        };
    }

    try {
        const { text, language } = JSON.parse(event.body);
        
        if (!text || text.trim().length === 0) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'No text provided' })
            };
        }

        // Limit text length to avoid API issues
        const truncatedText = text.substring(0, 1500);
        
        // Style prompt for wise, warm elderly rabbi voice
        const stylePrompt = language === 'he' 
            ? `Speak as a warm, wise elderly rabbi in his 70s with a gentle Israeli accent. Your voice should be fatherly, patient, and full of wisdom. Pace should be measured and thoughtful, with natural pauses for emphasis. Convey warmth and deep caring in every word.`
            : `Speak as a warm, wise elderly rabbi in his 70s. Your voice should be gentle, fatherly, and full of ancient wisdom. Pace should be measured and thoughtful, with appropriate pauses for emphasis. You have a slight Eastern European Jewish accent - warm and comforting. Convey deep caring and patience in every word, like a loving grandfather sharing wisdom.`;

        // Try Gemini 2.5 Flash TTS (most reliable for TTS)
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `${stylePrompt}\n\nSpeak the following text:\n"${truncatedText}"` }]
                    }],
                    generationConfig: {
                        responseModalities: ['AUDIO'],
                        speechConfig: {
                            voiceConfig: {
                                prebuiltVoiceConfig: {
                                    voiceName: 'Charon' // Deep, warm, wise male voice
                                }
                            }
                        }
                    }
                })
            }
        );

        const data = await response.json();
        
        console.log('TTS API response status:', response.status);
        
        if (data.error) {
            console.error('Gemini TTS error:', data.error);
            return {
                statusCode: 500,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ 
                    error: data.error.message || 'TTS generation failed',
                    fallback: true
                })
            };
        }

        // Extract audio data
        const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        const mimeType = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'audio/wav';
        
        if (!audioData) {
            console.error('No audio data in response');
            return {
                statusCode: 500,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'No audio generated', fallback: true })
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                audio: audioData,
                mimeType: mimeType
            })
        };

    } catch (error) {
        console.error('TTS Function error:', error);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: error.message, fallback: true })
        };
    }
};
