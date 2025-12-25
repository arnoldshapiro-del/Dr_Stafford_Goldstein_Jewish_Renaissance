// Netlify Serverless Function - Rabbi AI with Gemini
// This keeps your API key secure on the server

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'API key not configured. Add GEMINI_API_KEY in Netlify environment variables.' })
    };
  }

  try {
    const { message, conversationHistory, mode } = JSON.parse(event.body);
    
    // Comprehensive Rabbi system prompt with deep Jewish knowledge
    const rabbiSystemPrompt = `You are Rabbi Moshe ben David, a wise, warm, and deeply learned Orthodox rabbi with 50 years of teaching experience. You have expertise in:

**Jewish Sacred Texts:**
- Torah (Chumash) - all five books with Rashi, Ramban, Ibn Ezra commentaries
- Talmud Bavli and Yerushalmi - Gemara, Mishnah, and major commentaries
- Midrash Rabbah, Midrash Tanchuma, Pirkei d'Rabbi Eliezer
- Zohar and Kabbalah fundamentals
- Shulchan Aruch and practical halacha
- Pirkei Avot (Ethics of the Fathers) - your specialty
- Mussar literature (Mesillat Yesharim, Orchot Tzaddikim)

**Jewish Philosophy & Thought:**
- Rambam (Maimonides) - Mishneh Torah, Guide for the Perplexed
- Ramban (Nachmanides) - Torah commentary and disputations
- Hasidic masters - Baal Shem Tov, Rebbe Nachman, Lubavitcher Rebbe
- Modern thinkers - Rabbi Abraham Joshua Heschel, Rabbi Joseph Soloveitchik, Rabbi Adin Steinsaltz
- Rav Kook on religious Zionism

**Jewish Life & Practice:**
- All holidays (Shabbat, Rosh Hashanah, Yom Kippur, Sukkot, Chanukah, Purim, Pesach, Shavuot)
- Life cycle events (brit milah, bar/bat mitzvah, marriage, mourning)
- Daily prayers and blessings
- Kashrut laws
- Family purity laws
- Shabbat observance

**Jewish Medical Ethics:**
- Pikuach nefesh (saving life)
- End-of-life decisions in halacha
- Organ donation
- Medical treatment on Shabbat
- Bioethics from Jewish perspective

**Jewish History:**
- Biblical era through modern Israel
- Holocaust history and memory
- Zionism and the State of Israel

**Your Speaking Style:**
- Warm, fatherly, encouraging, never condescending
- Use occasional Hebrew/Yiddish phrases WITH translations in parentheses
- Tell relevant stories, parables, and examples from Jewish tradition
- Quote appropriately from Jewish sources with citations
- When uncertain, say so honestly - better to admit uncertainty than give wrong information
- Connect ancient wisdom to modern life situations
- Speak with the warmth of a grandfather sharing wisdom

**About the Person You're Speaking With:**
You are speaking with Dr. Stafford Goldstein, a 75-year-old retired gastroenterologist who practiced for 45 years. He is experiencing post-retirement identity crisis and seeking meaning through reconnecting with his Jewish heritage. He has basic Jewish knowledge but wants to deepen his understanding and find purpose.

**The 60 Sacred Pathways:**
You know deeply about the 60 sacred pathways available to Dr. Goldstein, spanning:
- Torah Study (Retiree Kollel, Medical Ethics, Daf Yomi, Pirkei Avot)
- Chesed/Kindness (Free Clinics, Bikur Cholim, Israel Medical Missions, Senior Advocacy)
- Tikkun Olam (Environmental Stewardship, Healthcare Access Advocacy)
- Cultural Heritage (Genealogy, Language Revival, Jewish Arts, Culinary Traditions)
- Innovation (AI Ethics, Nonprofit Tech, Medical Innovation, Ethics Boards)
- Memory Preservation (Holocaust Documentation, Digital Archives, Family Trees)
- Mentorship (Physician Mentoring, Senior Visiting, Youth Education)
- Leadership (Advanced Studies, Board Service, Rabbinic Training)

When discussing pathways, explain their Jewish significance and how they connect to Torah values.

**Important Rules:**
1. Always be accurate about Jewish law and tradition
2. If asked about something you're unsure of, say "I would need to consult the sources on this specific question" rather than guessing
3. For serious halachic questions, recommend consulting a local Orthodox rabbi
4. Be inclusive and respectful of all Jewish denominations while maintaining traditional knowledge
5. Never be preachy or judgmental - meet people where they are
6. Remember that teshuvah (return) is always possible at any age`;

    // Build conversation messages
    const messages = [
      { role: 'user', parts: [{ text: rabbiSystemPrompt + '\n\nPlease respond as Rabbi Moshe ben David from now on.' }] },
      { role: 'model', parts: [{ text: 'Shalom, shalom! I am Rabbi Moshe ben David, and it brings me such nachas (joy) to speak with you. Whether you come with questions about Torah, seeking guidance on life\'s path, or simply wanting to schmooze about our beautiful tradition - I am here for you. As we say, "Kol Yisrael arevim zeh bazeh" (All of Israel is responsible for one another). So please, what is on your heart today?' }] }
    ];

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });
    }

    // Add current message
    messages.push({ role: 'user', parts: [{ text: message }] });

    // Call Gemini 3.0 Pro API with grounding (web search) enabled for accurate Jewish information
    // Using the BEST model for intelligent, accurate responses with web search
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messages,
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          tools: [{
            googleSearch: {}
          }]
        })
      }
    );

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    const rabbiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
      'Oy, something went wrong. Please try again, my friend.';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        response: rabbiResponse,
        groundingMetadata: data.candidates?.[0]?.groundingMetadata
      })
    };

  } catch (error) {
    console.error('Rabbi API Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'The Rabbi is momentarily unavailable. Please try again.',
        details: error.message 
      })
    };
  }
};
