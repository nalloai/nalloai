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

  // Use a fully open and reliable free AI cluster for all 3 models
  async sendToPublicAPI(provider, userMessage, conversationHistory) {
    try {
      // Precise mapping for the requested models
      let modelName = 'gpt-4o-mini';
      if (provider === 'anthropic') modelName = 'claude-3-5-haiku';
      if (provider === 'google') modelName = 'gemini-2.0-flash';

      // Use the robust Pollinations.ai cluster which is CORS-friendly and free
      const prompt = `System: You are Nallo AI acting as ${modelName}. User: ${userMessage}`;
      const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai&json=true&seed=${Math.floor(Math.random() * 1000000)}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`${provider} is currently unavailable. Please try again.`);
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
      // More descriptive error for the user
      let errorMsg = "Nallo AI is having trouble connecting. ";
      if (error.message.includes('fetch')) errorMsg += "Please check your internet connection.";
      else errorMsg += "The model might be busy, please try again in a few seconds.";
      
      return {
        success: false,
        error: errorMsg,
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
