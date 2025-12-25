// Netlify Serverless Function - Pathway Recommender
// Analyzes user responses and recommends best pathways

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
    const { answers } = JSON.parse(event.body);
    
    const prompt = `You are Rabbi Moshe ben David, helping Dr. Stafford Goldstein (75-year-old retired gastroenterologist) find his ideal pathways for his Jewish Renaissance.

Based on his quiz answers, recommend his TOP 5 pathways from the 60 available:

**His Quiz Answers:**
${JSON.stringify(answers, null, 2)}

**Available Pathway Categories:**
1. Torah Study (Retiree Kollel, Jewish Medical Ethics Teaching, Daf Yomi, Pirkei Avot Mastery)
2. Chesed/Kindness (Free Clinic Director, Bikur Cholim, Israel Medical Missions, Jewish Senior Advocacy)
3. Tikkun Olam (Environmental Stewardship, Healthcare Access Advocacy)
4. Cultural Heritage (Jewish Genealogy, Yiddish/Hebrew Revival, Jewish Arts, Culinary Traditions)
5. Innovation (AI Ethics, Nonprofit Tech Leadership, Medical Innovation Incubator, Ethics Board Leadership, Digital Education)
6. Memory Preservation (Holocaust Oral History, Heritage Testimonies, Digital Archives, Family Tree Reconstruction, Historical Society Leadership)
7. Mentorship (Physician Network Mentorship, Nonprofit Consulting, Senior Friendly Visiting, Kolel Leadership, Youth Health Education)
8. Leadership (Gratz College Studies, Experiential Education, Board Service, Rabbinic Training, Cultural Fellowships)

**Provide your response in this EXACT JSON format:**
{
  "recommendations": [
    {
      "rank": 1,
      "pathway": "Pathway Name",
      "category": "Category Name",
      "matchScore": 95,
      "whyItFits": "2-3 sentences explaining why this is perfect for him based on his answers",
      "firstStep": "One specific action to take this week",
      "jewishConnection": "How this connects to Jewish values/texts"
    }
  ],
  "rabbiMessage": "A warm, personal message from the Rabbi about his journey ahead"
}

Return ONLY valid JSON, no other text.`;

    // Use Gemini 3.0 Pro for best reasoning and personalized recommendations
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    let content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean up JSON if wrapped in markdown
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const recommendations = JSON.parse(content);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(recommendations)
    };

  } catch (error) {
    console.error('Pathway Recommender Error:', error);
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
