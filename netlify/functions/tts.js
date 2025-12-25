// Netlify Serverless Function - Rabbi Text-to-Speech
// Uses Gemini 2.5 Pro TTS for beautiful, expressive Rabbi voice

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'API key not configured' })
    };
  }

  try {
    const { text, language } = JSON.parse(event.body);
    
    // Detailed style prompt for wise, warm elderly rabbi voice
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

    // Use Gemini 2.5 Pro TTS for highest quality, most expressive voice
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-tts:generateContent?key=${GEMINI_API_KEY}`,
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
                  voiceName: 'Charon' // Deep, warm, wise male voice
                }
              }
            }
          }
        })
      }
    );

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!audioData) {
      throw new Error('No audio generated');
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ audio: audioData })
    };

  } catch (error) {
    console.error('TTS Error:', error);
    
    // Fallback to Gemini 2.5 Flash TTS if Pro fails
    try {
      const { text } = JSON.parse(event.body);
      const fallbackResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `Speak warmly and wisely like an elderly rabbi:\n"${text}"` }]
            }],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Charon' }
                }
              }
            }
          })
        }
      );
      
      const fallbackData = await fallbackResponse.json();
      const fallbackAudio = fallbackData.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (fallbackAudio) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ audio: fallbackAudio })
        };
      }
    } catch (fallbackError) {
      console.error('Fallback TTS also failed:', fallbackError);
    }
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
