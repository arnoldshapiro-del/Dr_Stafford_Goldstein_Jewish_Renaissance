// Netlify Serverless Function - Hebrew/English Translation
// Uses Gemini 2.5 Flash for accurate translation with Jewish context

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
    const { text, direction = 'toEnglish' } = JSON.parse(event.body);
    
    if (!text || typeof text !== 'string') {
      return { 
        statusCode: 400, 
        headers: corsHeaders, 
        body: JSON.stringify({ error: 'Text is required' }) 
      };
    }

    let prompt;
    if (direction === 'toHebrew') {
      prompt = `You are an expert Hebrew translator with deep knowledge of both modern and biblical Hebrew, as well as Jewish religious terminology.

Translate the following English text to Hebrew.
- Use modern Hebrew but preserve religious/Jewish terminology appropriately
- Maintain the tone and feeling of the original
- For religious terms, use standard Hebrew equivalents

Respond with JSON:
{
  "hebrew": "Hebrew text in Hebrew characters",
  "transliteration": "Hebrew pronunciation in English letters",
  "original": "original English text"
}

Text to translate: "${text}"`;
    } else {
      prompt = `You are an expert Hebrew-to-English translator with deep knowledge of Jewish texts, culture, and terminology.

Translate the following Hebrew text to English.
- Preserve the meaning and nuance of the original
- Keep Hebrew terms commonly used in Jewish contexts (like "shalom", "mitzvah", "chesed") with translations in parentheses if needed
- If the input is transliterated Hebrew, translate it to English

Respond with JSON:
{
  "english": "English translation",
  "original": "original text",
  "notes": "any relevant notes about translation or cultural context (optional, can be null)"
}

Text to translate: "${text}"`;
    }

    // Call Gemini 2.5 Flash API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024
          }
        })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API error:', JSON.stringify(data));
      throw new Error(data.error?.message || 'Translation failed');
    }

    let responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean up JSON response
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      result = { translation: responseText };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        direction: direction,
        result: result,
        model: 'gemini-2.5-flash'
      })
    };

  } catch (error) {
    console.error('Translation error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message })
    };
  }
};
