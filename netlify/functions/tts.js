// Rabbi Moshe Text-to-Speech Function
// Uses Gemini 2.5 Flash TTS Preview for warm, wise Rabbi voice

exports.handler = async (event, context) => {
  // CORS headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API key not configured' })
      };
    }

    const { text, language = 'en' } = JSON.parse(event.body);
    
    if (!text) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Text is required' })
      };
    }

    // Style prompt for wise, warm elderly rabbi voice
    const stylePrompt = language === 'he' 
      ? 'Speak as a warm, wise elderly rabbi with a gentle Israeli accent. Measured, thoughtful pace.'
      : 'Speak as a warm, wise elderly rabbi. Gentle, fatherly voice full of wisdom. Measured pace with thoughtful pauses.';

    // Try Gemini 2.5 Flash TTS Preview
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${stylePrompt}\n\nSay: "${text}"` }]
          }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: 'Charon' // Deep, warm male voice
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
      console.log('TTS API error:', data.error.message);
      // Tell frontend to use browser TTS as fallback
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          useBrowserTTS: true,
          text: text,
          voiceSettings: {
            rate: 0.85,
            pitch: 0.9,
            lang: language === 'he' ? 'he-IL' : 'en-US'
          }
        })
      };
    }

    const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!audioData) {
      // No audio generated, use browser TTS
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          useBrowserTTS: true,
          text: text,
          voiceSettings: {
            rate: 0.85,
            pitch: 0.9,
            lang: language === 'he' ? 'he-IL' : 'en-US'
          }
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        audio: audioData,
        mimeType: 'audio/L16;rate=24000',
        model: 'gemini-2.5-flash-preview-tts'
      })
    };

  } catch (error) {
    console.error('TTS Error:', error);
    // On any error, fallback to browser TTS
    const { text = '', language = 'en' } = JSON.parse(event.body || '{}');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        useBrowserTTS: true,
        text: text,
        voiceSettings: {
          rate: 0.85,
          pitch: 0.9,
          lang: language === 'he' ? 'he-IL' : 'en-US'
        }
      })
    };
  }
};
