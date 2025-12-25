// Netlify Serverless Function - Rabbi Voice Text-to-Speech
// Uses Gemini 2.5 Flash TTS for warm, wise Rabbi voice

exports.handler = async (event, context) => {
  // CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers: corsHeaders, 
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    return { 
      statusCode: 500, 
      headers: corsHeaders, 
      body: JSON.stringify({ error: 'API key not configured' }) 
    };
  }

  try {
    const { text, language = 'en' } = JSON.parse(event.body);
    
    if (!text || typeof text !== 'string') {
      return { 
        statusCode: 400, 
        headers: corsHeaders, 
        body: JSON.stringify({ error: 'Text is required' }) 
      };
    }

    // Style prompt for wise, warm elderly rabbi voice
    const stylePrompt = language === 'he' 
      ? `Speak as a warm, wise elderly rabbi in his 70s with a gentle Israeli accent.
         Your voice should be fatherly, patient, and full of wisdom.
         Pace should be measured and thoughtful, with natural pauses for emphasis.
         Convey warmth and deep caring in every word.`
      : `Speak as a warm, wise elderly rabbi in his 70s.
         Your voice should be gentle, fatherly, and full of ancient wisdom.
         Pace should be measured and thoughtful, with appropriate pauses for emphasis.
         You have a slight Eastern European Jewish accent - warm and comforting.
         Convey deep caring and patience in every word, like a loving grandfather sharing wisdom.`;

    // Try Gemini 2.5 Flash Preview TTS (supports expressive voices)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${stylePrompt}\n\nSpeak the following text:\n"${text}"` }]
          }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: 'Charon'
                }
              }
            }
          }
        })
      }
    );

    const data = await response.json();
    
    if (data.error) {
      console.error('TTS API error:', data.error);
      throw new Error(data.error.message || 'TTS generation failed');
    }

    // Extract audio data
    const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    const mimeType = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'audio/L16;codec=pcm;rate=24000';
    
    if (!audioData) {
      throw new Error('No audio generated');
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        audio: audioData,
        mimeType: mimeType,
        model: 'gemini-2.5-flash-preview-tts'
      })
    };

  } catch (error) {
    console.error('TTS Error:', error);
    
    // Return error with fallback suggestion
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: error.message,
        fallback: 'browser-speech-synthesis',
        message: 'TTS unavailable. Use browser speech synthesis as fallback.'
      })
    };
  }
};
