// Rabbi Moshe Text-to-Speech Function
// Uses Gemini 2.5 Flash TTS and converts L16 PCM to WAV

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
            body: JSON.stringify({ error: 'API key not configured', fallback: true })
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

        // Limit text length
        const truncatedText = text.substring(0, 800);
        
        // Style prompt for wise rabbi voice
        const voicePrompt = language === 'he' 
            ? `Speak warmly as an elderly rabbi: "${truncatedText}"`
            : `Speak as a warm, wise elderly rabbi with gentle pace: "${truncatedText}"`;

        // Try Gemini 2.5 Flash TTS
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: voicePrompt }]
                    }],
                    generationConfig: {
                        responseModalities: ['AUDIO'],
                        speechConfig: {
                            voiceConfig: {
                                prebuiltVoiceConfig: {
                                    voiceName: 'Charon' // Deep, warm MALE voice
                                }
                            }
                        }
                    }
                })
            }
        );

        const data = await response.json();
        
        console.log('TTS API status:', response.status);
        
        if (data.error) {
            console.error('Gemini TTS error:', data.error.message);
            return {
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: data.error.message, fallback: true })
            };
        }

        // Extract audio data
        const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        const mimeType = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || '';
        
        if (!audioData) {
            console.error('No audio data in response');
            return {
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'No audio generated', fallback: true })
            };
        }

        console.log('Audio mimeType:', mimeType);
        
        // If it's L16 PCM format, convert to WAV
        if (mimeType.includes('L16') || mimeType.includes('pcm')) {
            // Decode base64 to binary
            const pcmBuffer = Buffer.from(audioData, 'base64');
            
            // Create WAV header for 24kHz, 16-bit, mono PCM
            const wavBuffer = addWavHeader(pcmBuffer, 24000, 16, 1);
            
            // Return as base64 WAV
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    audio: wavBuffer.toString('base64'),
                    mimeType: 'audio/wav'
                })
            };
        }

        // Return as-is if already in a playable format
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                audio: audioData,
                mimeType: mimeType || 'audio/wav'
            })
        };

    } catch (error) {
        console.error('TTS Function error:', error);
        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: error.message, fallback: true })
        };
    }
};

// Function to add WAV header to raw PCM data
function addWavHeader(pcmData, sampleRate, bitsPerSample, numChannels) {
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcmData.length;
    const headerSize = 44;
    const fileSize = headerSize + dataSize - 8;
    
    const header = Buffer.alloc(headerSize);
    
    // RIFF header
    header.write('RIFF', 0);
    header.writeUInt32LE(fileSize, 4);
    header.write('WAVE', 8);
    
    // fmt chunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // fmt chunk size
    header.writeUInt16LE(1, 20); // audio format (1 = PCM)
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    
    // data chunk
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);
    
    return Buffer.concat([header, pcmData]);
}
