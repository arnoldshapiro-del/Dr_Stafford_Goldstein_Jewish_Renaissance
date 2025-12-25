// Netlify Serverless Function - Hebrew/English Translation
// Uses Gemini 2.5 Pro for highest quality, accurate translation

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
    const { text, direction } = JSON.parse(event.body);
    
    let prompt;
    if (direction === 'en-to-he') {
      prompt = `You are an expert Hebrew translator with deep knowledge of both modern and biblical Hebrew.
      
Translate the following English text to Hebrew. 
- Use modern Hebrew but preserve any religious/Jewish terminology appropriately
- Maintain the tone and feeling of the original
- Provide only the Hebrew translation, nothing else:

"${text}"`;
    } else {
      prompt = `You are an expert Hebrew-to-English translator with deep knowledge of Jewish texts and culture.
      
Translate the following Hebrew text to English.
- Preserve the meaning and nuance of the original
- Keep any Hebrew terms that are commonly used in Jewish contexts (like "shalom", "mitzvah") with translations in parentheses if needed
- Provide only the English translation, nothing else:

"${text}"`;
    }

    // Use Gemini 2.5 Pro for highest quality translation
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    const translation = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ translation: translation.trim() })
    };

  } catch (error) {
    console.error('Translation Error:', error);
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
