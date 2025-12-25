// Hebrew/English Translation Function
// Uses Gemini 2.5 Flash for accurate translation

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

    const { text, direction } = JSON.parse(event.body);
    
    if (!text) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Text is required' })
      };
    }

    let prompt;
    if (direction === 'toHebrew' || direction === 'en-to-he') {
      prompt = `You are an expert Hebrew translator with deep knowledge of both modern and biblical Hebrew.

Translate the following English text to Hebrew. Provide both the Hebrew text and a transliteration for pronunciation.

Text to translate: "${text}"

Format your response as JSON:
{
  "hebrew": "Hebrew text in Hebrew characters",
  "transliteration": "Hebrew pronunciation in English letters",
  "original": "original English text"
}`;
    } else {
      prompt = `You are an expert Hebrew-to-English translator with deep knowledge of Jewish texts and culture.

Translate the following Hebrew text to English. If the input is already transliterated Hebrew, translate it to English.

Text to translate: "${text}"

Format your response as JSON:
{
  "english": "English translation",
  "original": "original text",
  "notes": "any relevant notes about the translation or cultural context (optional)"
}`;
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
            maxOutputTokens: 512
          }
        })
      }
    );

    const data = await response.json();
    
    console.log('Gemini API response status:', response.status);
    
    if (!response.ok) {
      console.error('Gemini API error:', JSON.stringify(data));
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'API error', 
          details: data.error?.message || 'Unknown error'
        })
      };
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
      headers,
      body: JSON.stringify({
        direction: direction,
        result: result
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
