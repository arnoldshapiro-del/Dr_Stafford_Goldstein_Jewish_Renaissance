# 🕎 Dr. Stafford Goldstein's Jewish Renaissance

A beautiful, interactive web application helping retired physicians find meaning and purpose through Jewish wisdom, featuring an AI Rabbi powered by Google Gemini.

## ✨ Features

### 🤖 AI Rabbi Moshe ben David
- **Comprehensive Jewish Knowledge**: Answers questions about Torah, Talmud, Jewish holidays, history, customs, medical ethics, and more
- **Web Search Integration**: Uses Google Search grounding for accurate, up-to-date answers
- **Voice Input**: Speak your questions using the microphone button
- **Voice Output**: Hear the Rabbi's responses spoken aloud
- **Hebrew/English**: Switch between languages, translate messages

### 📿 Daily Inspiration
- **Daily Blessing**: Fresh blessing each day with Hebrew, transliteration, and meaning
- **Torah Verse**: Personalized daily verse with commentary
- **Pathway of the Day**: Suggested pathway to explore today
- **Shabbat Times**: Candle lighting and Havdalah times for your location

### 🎯 Pathway Discovery Quiz
- 8-question assessment to find your perfect pathways
- Personalized recommendations from Rabbi Moshe
- Match scores and first steps for each pathway

### 📚 60 Sacred Pathways
- Torah Study (Kollel, Medical Ethics, Daf Yomi, Pirkei Avot)
- Chesed/Kindness (Free Clinics, Bikur Cholim, Israel Missions)
- Tikkun Olam (Environmental, Healthcare Advocacy)
- Cultural Heritage (Genealogy, Languages, Arts, Culinary)
- Innovation (AI Ethics, Medical Tech, Digital Education)
- Memory Preservation (Holocaust Documentation, Archives)
- Mentorship (Physician Network, Youth, Seniors)
- Leadership (Board Service, Advanced Studies)

---

## 🚀 Quick Deploy to Netlify

### Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza...`)

### Step 2: Upload to GitHub

1. Create a new repository on GitHub
2. Upload ALL files from this folder:
   - `index.html`
   - `netlify.toml`
   - `netlify/functions/rabbi.js`
   - `netlify/functions/tts.js`
   - `netlify/functions/translate.js`
   - `netlify/functions/daily.js`
   - `netlify/functions/recommend.js`

### Step 3: Deploy to Netlify

1. Go to [Netlify](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select your repository
4. Click "Deploy site"

### Step 4: Add Your API Key

1. In Netlify, go to **Site settings** → **Environment variables**
2. Click "Add a variable"
3. Set:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Your Gemini API key (paste it here)
4. Click "Save"
5. Go to **Deploys** → Click "Trigger deploy" → "Deploy site"

### Step 5: Share the Link! 🎉

Your site is now live at: `https://your-site-name.netlify.app`

Share this link with anyone - the AI Rabbi and all features will work!

---

## 💰 Cost Estimate

Using Gemini 2.0 Flash (the cheapest option):
- **Input**: $0.15 per million tokens
- **Output**: $0.60 per million tokens

**Typical monthly cost**: $5-15 depending on usage

If Stafford uses it 10-20 times per day, expect about $5-10/month.

---

## 🔧 Technical Details

### API Endpoints (Netlify Functions)

| Endpoint | Purpose |
|----------|---------|
| `/.netlify/functions/rabbi` | Main AI chat with web search |
| `/.netlify/functions/tts` | Text-to-speech (Rabbi voice) |
| `/.netlify/functions/translate` | Hebrew ↔ English translation |
| `/.netlify/functions/daily` | Daily blessing, verse, Shabbat times |
| `/.netlify/functions/recommend` | Pathway quiz analysis |

### External APIs Used

- **Gemini 3.0 Pro** (Preview): Rabbi AI chat with web search grounding - smartest model for accurate Jewish knowledge
- **Gemini 2.5 Pro TTS**: Beautiful, expressive Rabbi voice - highest quality text-to-speech
- **Gemini 2.5 Pro**: Translation and daily content generation
- **Hebcal API**: Shabbat times (free, no key needed)

---

## 📱 Mobile Friendly

The app works great on phones and tablets. The Rabbi chat button appears in the bottom-right corner on all devices.

---

## ❤️ Made with Love

Created for Dr. Stafford Goldstein's Jewish Renaissance journey.

*"They will bear fruit even in old age, vital and fresh" - Tehillim 92:15*

---

## 🆘 Troubleshooting

**Rabbi not responding?**
1. Check that GEMINI_API_KEY is set in Netlify environment variables
2. Trigger a redeploy after adding the key

**Voice features not working?**
- Voice input requires Chrome or Edge browser
- Make sure microphone permissions are allowed

**Shabbat times wrong?**
- Allow location access when prompted
- Or it defaults to New York times

---

לחיים ולשלום!
*To life and peace!*
