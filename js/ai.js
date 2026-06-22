// AI Model Integration Module
class AIManager {
  constructor() {
    this.currentModel = 'gpt4o-mini';
    this.apiKeys = this.loadApiKeys();
    this.conversationHistory = [];
  }

  loadApiKeys() {
    try {
      const stored = localStorage.getItem(NALLO_CONFIG.storage.apiKeys);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading API keys:', error);
      return {};
    }
  }

  saveApiKeys(keys) {
    try {
      localStorage.setItem(NALLO_CONFIG.storage.apiKeys, JSON.stringify(keys));
      this.apiKeys = keys;
      return true;
    } catch (error) {
      console.error('Error saving API keys:', error);
      return false;
    }
  }

  setCurrentModel(modelId) {
    if (NALLO_CONFIG.models[modelId]) {
      this.currentModel = modelId;
      localStorage.setItem(NALLO_CONFIG.storage.currentModel, modelId);
      return true;
    }
    return false;
  }

  getCurrentModel() {
    return NALLO_CONFIG.models[this.currentModel] || null;
  }

  async sendMessage(userMessage, conversationHistory = []) {
    try {
      const model = this.getCurrentModel();
      
      if (!model) {
        throw new Error('Invalid model selected');
      }

      switch (model.provider) {
        case 'openai':
          return await this.sendToOpenAI(userMessage, conversationHistory);
        case 'anthropic':
          return await this.sendToAnthropic(userMessage, conversationHistory);
        case 'google':
          return await this.sendToGoogle(userMessage, conversationHistory);
        default:
          throw new Error('Unknown AI provider');
      }
    } catch (error) {
      console.error('AI message error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendToOpenAI(userMessage, conversationHistory) {
    try {
      const apiKey = this.apiKeys.openai || '';
      
      // Use public/free endpoint if no API key is provided
      if (!apiKey) {
        return await this.sendToPublicAPI('openai', userMessage, conversationHistory);
      }

      const messages = [
        ...conversationHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content,
        })),
        { role: 'user', content: userMessage },
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API error');
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;

      return {
        success: true,
        message: assistantMessage,
        model: 'gpt4o-mini',
      };
    } catch (error) {
      console.error('OpenAI error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendToAnthropic(userMessage, conversationHistory) {
    try {
      const apiKey = this.apiKeys.anthropic || '';
      
      // Use public/free endpoint if no API key is provided
      if (!apiKey) {
        return await this.sendToPublicAPI('anthropic', userMessage, conversationHistory);
      }

      const messages = [
        ...conversationHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content,
        })),
        { role: 'user', content: userMessage },
      ];

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 2000,
          messages: messages,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Anthropic API error');
      }

      const data = await response.json();
      const assistantMessage = data.content[0].text;

      return {
        success: true,
        message: assistantMessage,
        model: 'claude-haiku',
      };
    } catch (error) {
      console.error('Anthropic error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendToGoogle(userMessage, conversationHistory) {
    try {
      const apiKey = this.apiKeys.google || '';
      
      // Use public/free endpoint if no API key is provided
      if (!apiKey) {
        return await this.sendToPublicAPI('google', userMessage, conversationHistory);
      }

      const contents = [
        ...conversationHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })),
        { role: 'user', parts: [{ text: userMessage }] },
      ];

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2000,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Google Gemini API error');
      }

      const data = await response.json();
      const assistantMessage = data.candidates[0].content.parts[0].text;

      return {
        success: true,
        message: assistantMessage,
        model: 'gemini-flash',
      };
    } catch (error) {
      console.error('Google Gemini error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  getAvailableModels() {
    return Object.entries(NALLO_CONFIG.models).map(([id, model]) => ({
      id,
      ...model,
    }));
  }

  getModelInfo(modelId) {
    return NALLO_CONFIG.models[modelId] || null;
  }

  clearConversationHistory() {
    this.conversationHistory = [];
  }

  addToHistory(message, sender, model) {
    this.conversationHistory.push({
      content: message,
      sender: sender,
      model: model,
      timestamp: new Date().toISOString(),
    });
  }

  // Fallback to public/free AI endpoints
  async sendToPublicAPI(provider, userMessage, conversationHistory) {
    try {
      // For demonstration, we'll use a public proxy or free endpoint
      // In a real app, this would point to a serverless function that handles the keys securely
      const response = await fetch('https://api.nallo.ai/v1/chat/free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          message: userMessage,
          history: conversationHistory,
          model: this.currentModel
        })
      });

      if (!response.ok) {
        // If our public API fails, show a helpful message
        throw new Error(`${provider} free tier is currently busy. Please add your own API key in settings for unlimited access.`);
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message,
        model: this.currentModel
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        needsApiKey: true
      };
    }
  }
}

const aiManager = new AIManager();

document.addEventListener('DOMContentLoaded', () => {
  const savedModel = localStorage.getItem(NALLO_CONFIG.storage.currentModel);
  if (savedModel) {
    aiManager.setCurrentModel(savedModel);
  }
});
