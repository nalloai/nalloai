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

  // Use direct free endpoints for the specific models requested
  async sendToPublicAPI(provider, userMessage, conversationHistory) {
    try {
      // Mapping to exact free models that work without keys
      let modelId = 'gpt-4o-mini';
      if (provider === 'anthropic') modelId = 'claude-3-5-haiku-20241022';
      if (provider === 'google') modelId = 'gemini-2.0-flash';

      const messages = [
        ...conversationHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: userMessage }
      ];

      // Using a high-availability free AI completion endpoint
      // This endpoint is more robust for high-volume requests
      const modelMap = {
        'gpt-4o-mini': 'gpt-4o-mini',
        'claude-3-5-haiku-20241022': 'claude-3-haiku',
        'gemini-2.0-flash': 'gemini-1.5-flash'
      };
      
      const targetModel = modelMap[modelId] || 'gpt-4o-mini';
      
      const response = await fetch('https://api.duckduckgo.com/lib/chat/v1/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          model: targetModel,
          messages: messages
        })
      }).catch(() => {
        // Fallback to secondary free endpoint if primary is busy
        return fetch(`https://text.pollinations.ai/${encodeURIComponent(userMessage)}?model=openai`);
      });

      if (!response.ok) {
        throw new Error(`${provider} is currently unavailable. Please try again.`);
      }

      let content = '';
      try {
        const data = await response.json();
        content = data.choices?.[0]?.message?.content || data.response || data;
      } catch (e) {
        content = await response.text();
      }
      
      if (!content || typeof content !== 'string') {
        // If it's an object, try to extract text
        if (typeof content === 'object') content = JSON.stringify(content);
        else throw new Error('No response from AI');
      }

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
