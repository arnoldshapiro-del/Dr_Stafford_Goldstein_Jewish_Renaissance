// Daily Inspiration Function
// Uses Gemini 2.5 Flash (stable, fast, reliable)

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

    const { type } = JSON.parse(event.body || '{}');

    let prompt = '';
    
    if (type === 'blessing') {
      prompt = `Generate a morning blessing for Dr. Stafford Goldstein, a 75-year-old retired gastroenterologist seeking meaning through Jewish pathways. 

Include:
1. A traditional Hebrew blessing (transliterated) with English translation
2. A brief personalized message (2-3 sentences) connecting the blessing to his journey of finding purpose in retirement

Keep it warm, encouraging, and concise. Format as JSON:
{
  "hebrew": "transliterated Hebrew blessing",
  "english": "English translation",
  "message": "personalized encouraging message"
}`;
    } else if (type === 'verse') {
      prompt = `Select an inspiring Torah verse for today that speaks to finding purpose and meaning in life's later chapters.

Choose from Tanach (Torah, Prophets, or Writings) - verses about wisdom, purpose, growth, or service.

Format as JSON:
{
  "hebrew": "Hebrew text transliterated",
  "english": "English translation",
  "source": "Book Chapter:Verse",
  "reflection": "Brief 1-2 sentence reflection on how this applies to finding meaning in retirement"
}`;
    } else if (type === 'pathway') {
      prompt = `Recommend one of the 60 sacred pathways for Dr. Stafford Goldstein today. The pathways include:
- Torah study (kollel, medical ethics, Daf Yomi, Pirkei Avot)
- Chesed work (free clinics, bikur cholim, Israel missions, senior advocacy)
- Tikkun olam (environmental stewardship, healthcare policy)
- Cultural heritage (genealogy, language revival, arts, culinary traditions)
- Innovation (AI ethics, nonprofit technology, medical innovation)
- Memory preservation (Holocaust documentation, digital archives)
- Mentorship (physician networks, senior visiting, youth education)
- Leadership (Jewish studies, board service, rabbinic training)

Format as JSON:
{
  "pathway": "Name of the pathway",
  "category": "Category (Torah/Chesed/Tikkun Olam/etc)",
  "description": "Brief 2-3 sentence description",
  "firstStep": "One concrete action to take today"
}`;
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid type. Use: blessing, verse, or pathway' })
      };
    }

    // Call Gemini 2.5 Flash API (stable)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
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
    
    // Clean up JSON response (remove markdown code blocks if present)
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse the JSON response
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Return raw text if JSON parsing fails
      result = { raw: responseText };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        type: type,
        data: result
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
