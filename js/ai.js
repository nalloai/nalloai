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
        throw new Error(`${provider} free tier is currently busy. Please try again in a moment.`);
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
