// Nallo AI Configuration
const NALLO_CONFIG = {
  // Supabase Configuration
  // Update these with your own Supabase credentials
  supabase: {
    url: 'https://dmlewfdutaptpwccrifx.supabase.co',
    anonKey: 'sb_publishable_P6Jt6LAK4M1Q2rnJpx3wtQ_bSyZ_pUO',
  },

  // AI Models Configuration
  models: {
    'gpt4o-mini': {
      name: 'GPT-4o Mini',
      label: 'Fast',
      provider: 'openai',
      model: 'gpt-4o-mini',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      description: 'Fast and efficient model for quick responses',
    },
    'claude-haiku': {
      name: 'Claude 3.5 Haiku',
      label: 'Smart',
      provider: 'anthropic',
      model: 'claude-3-5-haiku-20241022',
      endpoint: 'https://api.anthropic.com/v1/messages',
      description: 'Smart and balanced model for thoughtful responses',
    },
    'gemini-flash': {
      name: 'Gemini 2.0 Flash',
      label: 'Creative',
      provider: 'google',
      model: 'gemini-2.0-flash',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      description: 'Creative model for imaginative responses',
    },
  },

  // API Endpoints
  apiEndpoints: {
    openai: {
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
    },
    anthropic: {
      baseUrl: 'https://api.anthropic.com/v1',
      model: 'claude-3-5-haiku-20241022',
    },
    google: {
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
      model: 'gemini-2.0-flash',
    },
  },

  // Storage keys
  storage: {
    userProfile: 'nallo_user_profile',
    chatHistory: 'nallo_chat_history',
    apiKeys: 'nallo_api_keys',
    currentModel: 'nallo_current_model',
    sessionToken: 'nallo_session_token',
  },

  // UI Configuration
  ui: {
    maxMessageLength: 4000,
    maxChatHistory: 50,
    autoSaveInterval: 5000,
  },
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NALLO_CONFIG;
}
