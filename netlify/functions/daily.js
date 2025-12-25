// Netlify Serverless Function - Daily Jewish Content
// Generates daily blessing, Torah verse, and fetches Shabbat times

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  try {
    const { type, location } = JSON.parse(event.body);
    
    if (type === 'shabbat' && location) {
      // Use Hebcal API for Shabbat times (free, no key needed)
      const hebcalResponse = await fetch(
        `https://www.hebcal.com/shabbat?cfg=json&geonameid=${location.geonameid || ''}&geo=pos&latitude=${location.lat || 40.7128}&longitude=${location.lng || -74.0060}&tzid=${location.timezone || 'America/New_York'}`
      );
      const shabbatData = await hebcalResponse.json();
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ shabbat: shabbatData })
      };
    }

    if (!GEMINI_API_KEY) {
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'API key not configured' })
      };
    }

    // Get day of year for variety
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    
    let prompt;
    if (type === 'blessing') {
      prompt = `You are a wise rabbi. Generate a unique, meaningful daily blessing for day ${dayOfYear} of the year. 
      
      Format:
      1. Start with the Hebrew blessing text
      2. Provide transliteration in parentheses
      3. Provide English translation
      4. Add a brief (2-3 sentence) reflection on how this blessing can inspire the day
      
      Make it warm, personal, and relevant to someone seeking meaning in retirement. Each day should be different.`;
    } else if (type === 'verse') {
      prompt = `You are a Torah scholar. For day ${dayOfYear}, select a meaningful verse from Tanach (Hebrew Bible) that would inspire a 75-year-old retired physician seeking purpose.
      
      Format:
      1. Hebrew text of the verse
      2. English translation
      3. Source citation (Book Chapter:Verse)
      4. Brief commentary (3-4 sentences) explaining its relevance to finding meaning later in life
      
      Choose from Torah, Prophets, or Writings. Vary the selection each day.`;
    } else if (type === 'pathway') {
      prompt = `You are Rabbi Moshe ben David. Based on day ${dayOfYear}, suggest which of the 60 sacred pathways Dr. Stafford Goldstein should explore today. Choose from:
      
      Torah Pathways (Kollel, Medical Ethics, Daf Yomi, Pirkei Avot), Chesed Pathways (Free Clinic, Bikur Cholim, Israel Missions, Senior Advocacy), Tikkun Olam, Cultural Heritage, Innovation, Memory Preservation, Mentorship, or Leadership pathways.
      
      Provide:
      1. The pathway name
      2. A brief inspiring description (2-3 sentences)
      3. One small action to take today
      4. A relevant quote from Jewish sources`;
    }

    // Use Gemini 2.5 Pro for highest quality spiritual content
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ content: content.trim(), type })
    };

  } catch (error) {
    console.error('Daily Content Error:', error);
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
