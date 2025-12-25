// Gemini 2.5 Flash TTS - Amazing Human Voice
// Uses the latest Gemini 2.5 Flash TTS model for natural speech

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
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ fallback: true, error: 'API key not configured' })
            };
        }

        const body = JSON.parse(event.body || '{}');
        const text = body.text || '';
        const voice = body.voice || 'Charon'; // Deep male voice for Rabbi
        const style = body.style || 'Speak warmly and wisely like a kind elderly rabbi, with gentle pacing and occasional thoughtful pauses';

        if (!text) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'No text provided' })
            };
        }

        console.log('TTS Request - Text length:', text.length, 'Voice:', voice);

        // Call Gemini 2.5 Flash TTS API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `${style}: "${text}"`
                        }]
                    }],
                    generationConfig: {
                        responseModalities: ['AUDIO'],
                        speechConfig: {
                            voiceConfig: {
                                prebuiltVoiceConfig: {
                                    voiceName: voice
                                }
                            }
                        }
                    }
                })
            }
        );

        const data = await response.json();
        
        console.log('Gemini TTS response status:', response.status);
        
        if (!response.ok) {
            console.error('Gemini TTS error:', JSON.stringify(data));
            return {
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ 
                    fallback: true,
                    error: data.error?.message || 'TTS API error'
                })
            };
        }

        // Extract audio data
        const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (!audioData) {
            console.error('No audio data in response');
            return {
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ fallback: true, error: 'No audio generated' })
            };
        }

        console.log('TTS audio generated successfully, size:', audioData.length);

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                audio: audioData,
                mimeType: 'audio/L16;rate=24000',
                format: 'pcm16',
                sampleRate: 24000
            })
        };

    } catch (error) {
        console.error('TTS Function error:', error);
        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ fallback: true, error: error.message })
        };
    }
};
