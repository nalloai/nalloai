// AI Model Integration Module
class AIManager {
  constructor() {
    this.currentModel = 'gpt4o-mini';
    this.conversationHistory = [];
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
    return await this.sendToPublicAPI('openai', userMessage, conversationHistory);
  }

  async sendToAnthropic(userMessage, conversationHistory) {
    return await this.sendToPublicAPI('anthropic', userMessage, conversationHistory);
  }

  async sendToGoogle(userMessage, conversationHistory) {
    return await this.sendToPublicAPI('google', userMessage, conversationHistory);
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

  // Use truly free AI endpoints (Pollinations.ai) with POST for better stability
  async sendToPublicAPI(provider, userMessage, conversationHistory) {
    try {
      // Map providers to high-quality free models
      let modelName = 'openai'; // For GPT-4o Mini
      if (provider === 'anthropic') modelName = 'mistral'; // For Claude-like quality
      if (provider === 'google') modelName = 'searchgpt'; // For Gemini-like creativity

      const messages = [
        { role: 'system', content: `You are Nallo AI, a helpful assistant. You are currently acting as the ${provider} model.` },
        ...conversationHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: userMessage }
      ];

      const response = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages,
          model: modelName,
          json: true
        })
      });

      if (!response.ok) {
        throw new Error(`${provider} is currently busy. Please try again.`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || data.response;
      
      if (!content) throw new Error('No response from AI');

      return {
        success: true,
        message: content,
        model: this.currentModel
      };
    } catch (error) {
      console.error('Free AI API Error:', error);
      return {
        success: false,
        error: "Nallo AI is having trouble connecting. Please try again in a few seconds.",
        needsApiKey: false
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
