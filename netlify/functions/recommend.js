// Netlify Serverless Function - Pathway Recommendation Quiz
// Uses Gemini 2.5 Flash to analyze quiz answers and recommend pathways

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
    const { answers } = JSON.parse(event.body);
    
    if (!answers || !Array.isArray(answers)) {
      return { 
        statusCode: 400, 
        headers: corsHeaders, 
        body: JSON.stringify({ error: 'Quiz answers array is required' }) 
      };
    }

    const prompt = `You are Rabbi Moshe ben David, analyzing quiz responses from Dr. Stafford Goldstein, a 75-year-old retired gastroenterologist seeking meaning in retirement through Jewish pathways.

Based on the following quiz answers, recommend the top 5 pathways from the 60 sacred Jewish pathways for retirement fulfillment.

Quiz Answers:
${answers.map((a, i) => `Q${i+1}: ${a.question || 'Question'} - Answer: ${a.answer}`).join('\n')}

Available Pathway Categories:
1. Torah Study: Kollel learning, Jewish medical ethics, Daf Yomi, Pirkei Avot mastery
2. Chesed (Loving Kindness): Free clinic volunteering, Bikur Cholim, Israel medical missions, Jewish senior advocacy
3. Tikkun Olam (Repairing World): Environmental stewardship, healthcare access advocacy
4. Cultural Heritage: Jewish genealogy, Yiddish/Hebrew revival, Jewish arts, culinary traditions
5. Innovation: AI ethics, nonprofit technology, medical innovation mentoring, ethics boards
6. Memory Preservation: Holocaust oral history, heritage testimonies, digital archives, family tree reconstruction
7. Mentorship: Jewish physicians network, nonprofit consulting, senior visiting, youth education
8. Spiritual Leadership: Jewish studies, experiential education, board service, rabbinic training

Analyze the answers and provide personalized pathway recommendations.

Format as JSON:
{
  "recommendations": [
    {
      "rank": 1,
      "pathway": "Pathway name",
      "category": "Category",
      "matchScore": 95,
      "reason": "Why this pathway matches based on their answers (2-3 sentences)",
      "firstStep": "Concrete first action to take",
      "jewishWisdom": "A relevant Jewish teaching or proverb"
    }
  ],
  "personalMessage": "A warm, encouraging message from Rabbi Moshe about their journey (3-4 sentences)"
}`;

    // Call Gemini 2.5 Flash API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API error:', JSON.stringify(data));
      throw new Error(data.error?.message || 'Recommendation failed');
    }

    let responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean up JSON response
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      result = { raw: responseText };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        ...result,
        model: 'gemini-2.5-flash'
      })
    };

  } catch (error) {
    console.error('Recommendation error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message })
    };
  }
};
