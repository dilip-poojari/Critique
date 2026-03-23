# AI Provider Alternatives for CritFull

CritFull currently uses **Anthropic Claude** as the default AI provider, but you have several alternatives:

## 🤖 Option 1: Anthropic Claude (Current Default)
- **Model**: Claude Sonnet 4
- **Best For**: Detailed UX analysis with comprehensive feedback
- **API Key**: Get from [console.anthropic.com](https://console.anthropic.com/)
- **Pricing**: Pay-as-you-go, ~$3 per 1M input tokens
- **Free Tier**: $5 credit for new users

## 🧠 Option 2: OpenAI GPT-4 Vision
- **Model**: GPT-4 Vision Preview
- **Best For**: Visual analysis and general design critique
- **API Key**: Get from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Pricing**: ~$10 per 1M input tokens
- **Free Tier**: $5 credit for new users
- **Note**: Requires code modification (see below)

## ✨ Option 3: Google Gemini Pro Vision
- **Model**: Gemini Pro Vision
- **Best For**: Fast analysis with good accuracy
- **API Key**: Get from [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
- **Pricing**: Free tier available (60 requests/minute)
- **Free Tier**: ✅ Generous free quota
- **Note**: Requires code modification (see below)

## 🆓 Option 4: Local/Open Source Models
- **Ollama + Llama Vision**: Run locally, completely free
- **LM Studio**: Run models locally with GUI
- **Note**: Requires significant setup and local compute resources

---

## How to Switch Providers

### Current Implementation (Anthropic Only)
The current version of CritFull is configured for Anthropic Claude only. To use it:

1. Visit [console.anthropic.com](https://console.anthropic.com/)
2. Sign up and get your API key
3. Enter the key in CritFull when prompted
4. Start analyzing designs!

### Future Multi-Provider Support
We're working on adding native support for multiple AI providers. In the meantime, you can:

1. **Fork the repository** and modify `src/App.jsx`
2. **Replace the API call function** with your preferred provider
3. **Update the API endpoint and authentication**

### Example: Switching to OpenAI

Replace the `callAnthropicAPI` function in `src/App.jsx` with:

```javascript
const callOpenAIAPI = async (userMessage, base64Image = null) => {
  const content = [{ type: 'text', text: userMessage }];
  
  if (base64Image) {
    content.push({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${base64Image}` }
    });
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4-vision-preview',
      messages: [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content }
      ],
      max_tokens: 4096
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
};
```

### Example: Switching to Google Gemini

```javascript
const callGeminiAPI = async (userMessage, base64Image = null) => {
  const parts = [{ text: getSystemPrompt() + '\n\n' + userMessage }];
  
  if (base64Image) {
    parts.push({
      inline_data: {
        mime_type: 'image/jpeg',
        data: base64Image
      }
    });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          maxOutputTokens: 4096,
          temperature: 0.4
        }
      })
    }
  );

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
};
```

---

## Comparison Table

| Provider | Free Tier | Best For | Setup Difficulty | Response Quality |
|----------|-----------|----------|------------------|------------------|
| **Anthropic Claude** | $5 credit | Detailed UX analysis | ⭐ Easy | ⭐⭐⭐⭐⭐ Excellent |
| **OpenAI GPT-4** | $5 credit | Visual analysis | ⭐⭐ Moderate | ⭐⭐⭐⭐ Very Good |
| **Google Gemini** | ✅ Yes | Fast analysis | ⭐⭐ Moderate | ⭐⭐⭐⭐ Very Good |
| **Local Models** | ✅ Free | Privacy-focused | ⭐⭐⭐⭐ Hard | ⭐⭐⭐ Good |

---

## Recommended Approach

### For Most Users
**Use Anthropic Claude** (current default) - It provides the best balance of quality, ease of use, and cost.

### For Budget-Conscious Users
**Use Google Gemini** - Free tier is generous and quality is excellent for most use cases.

### For Privacy-Focused Users
**Use Local Models** - Keep all data on your machine, but requires technical setup.

---

## Need Help?

- **Issues**: [GitHub Issues](https://github.com/dilip-poojari/Critique/issues)
- **Discussions**: [GitHub Discussions](https://github.com/dilip-poojari/Critique/discussions)
- **Email**: Create an issue on GitHub

---

## Roadmap

- [ ] Native multi-provider support in UI
- [ ] Provider comparison mode
- [ ] Cost estimation per analysis
- [ ] Local model integration (Ollama)
- [ ] Batch analysis support