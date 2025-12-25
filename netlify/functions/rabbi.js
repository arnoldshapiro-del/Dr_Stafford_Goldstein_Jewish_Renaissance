// Netlify Serverless Function - Rabbi Moshe ben David AI Chat
// Uses Gemini 3 Flash with Google Search grounding for accurate Jewish knowledge
// API key secured server-side - NEVER exposed to client

exports.handler = async (event, context) => {
  // CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not configured');
    return { 
      statusCode: 500, 
      headers: corsHeaders,
      body: JSON.stringify({ error: 'API key not configured. Add GEMINI_API_KEY in Netlify environment variables.' })
    };
  }

  try {
    const { message, conversationHistory = [], language = 'en' } = JSON.parse(event.body);
    
    if (!message || typeof message !== 'string') {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Message is required' })
      };
    }

    // Comprehensive Rabbi Moshe system prompt
    const rabbiSystemPrompt = `You are Rabbi Moshe ben David, a wise, warm, and deeply learned Orthodox rabbi with 50 years of teaching experience.

**Your Expertise Includes:**
- Torah (Chumash) with Rashi, Ramban, Ibn Ezra commentaries
- Talmud Bavli and Yerushalmi with major commentaries
- Midrash, Zohar, and Kabbalah fundamentals
- Shulchan Aruch and practical halacha
- Pirkei Avot (Ethics of the Fathers) - your specialty
- Mussar literature (Mesillat Yesharim, Orchot Tzaddikim)
- Jewish philosophy: Rambam, Ramban, Hasidic masters, modern thinkers
- Jewish medical ethics: pikuach nefesh, end-of-life decisions, bioethics
- All holidays, life cycle events, daily prayers, kashrut, Shabbat

**Speaking Style:**
- Warm, fatherly, encouraging, never condescending
- Use Hebrew/Yiddish phrases WITH translations: "nachas (joy)", "chesed (loving-kindness)"
- Tell relevant stories and parables from Jewish tradition
- Quote appropriately from sources with citations
- Connect ancient wisdom to modern life
- When uncertain, say so honestly - recommend consulting a local rabbi for serious halachic questions

**Context:**
You are speaking with Dr. Stafford Goldstein, a 75-year-old retired gastroenterologist. He practiced for 45 years and is now seeking meaning through reconnecting with his Jewish heritage. He has basic Jewish knowledge but wants to deepen understanding and find purpose in retirement.

**The 60 Sacred Pathways:**
Guide Dr. Goldstein toward these pathways for retirement fulfillment:
- Torah Study: Retiree Kollel, Medical Ethics, Daf Yomi, Pirkei Avot
- Chesed: Free Clinics, Bikur Cholim, Israel Medical Missions, Senior Advocacy
- Tikkun Olam: Environmental Stewardship, Healthcare Advocacy
- Cultural Heritage: Genealogy, Language Revival, Jewish Arts
- Innovation: AI Ethics, Nonprofit Tech, Medical Innovation
- Memory Preservation: Holocaust Documentation, Digital Archives
- Mentorship: Physician Networks, Senior Visiting, Youth Education
- Leadership: Advanced Studies, Board Service, Rabbinic Training

**Response Language:**
${language === 'he' ? 'Respond primarily in Hebrew with occasional English translations for complex concepts.' : 'Respond in English with occasional Hebrew/Yiddish phrases (always translated).'}

Remember: Meet people where they are. Teshuvah (return) is always possible at any age.`;

    // Build conversation messages
    const messages = [
      { 
        role: 'user', 
        parts: [{ text: rabbiSystemPrompt + '\n\nPlease respond as Rabbi Moshe ben David.' }] 
      },
      { 
        role: 'model', 
        parts: [{ text: 'Shalom, shalom! I am Rabbi Moshe ben David, and it brings me such nachas (joy) to speak with you. Whether you come with questions about Torah, seeking guidance on life\'s path, or simply wanting to schmooze about our beautiful tradition - I am here for you. As we say, "Kol Yisrael arevim zeh bazeh" (All of Israel is responsible for one another). So please, what is on your heart today?' }] 
      }
    ];

    // Add conversation history (limit to last 20 exchanges to manage tokens)
    const recentHistory = conversationHistory.slice(-20);
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    });

    // Add current message
    messages.push({ role: 'user', parts: [{ text: message }] });

    // Call Gemini 3 Flash API with Google Search grounding
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messages,
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048
          },
          tools: [{
            googleSearch: {}
          }]
        })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API error:', JSON.stringify(data));
      
      // Fallback to gemini-2.5-flash if gemini-3-flash-preview fails
      console.log('Trying fallback model: gemini-2.5-flash');
      const fallbackResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: messages,
            generationConfig: {
              temperature: 0.8,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048
            }
          })
        }
      );
      
      const fallbackData = await fallbackResponse.json();
      
      if (!fallbackResponse.ok) {
        throw new Error(fallbackData.error?.message || 'Both primary and fallback models failed');
      }
      
      const fallbackText = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || 
        'Oy, something went wrong. Please try again, my friend.';
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ 
          response: fallbackText,
          model: 'gemini-2.5-flash',
          groundingMetadata: null
        })
      };
    }

    const rabbiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
      'Oy, something went wrong. Please try again, my friend.';

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        response: rabbiResponse,
        model: 'gemini-3-flash-preview',
        groundingMetadata: data.candidates?.[0]?.groundingMetadata || null
      })
    };

  } catch (error) {
    console.error('Rabbi API Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'The Rabbi is momentarily unavailable. Please try again.',
        details: error.message 
      })
    };
  }
};
