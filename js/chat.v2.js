// Chat Management Module
class ChatManager {
  constructor() {
    this.currentChatId = null;
    this.messages = [];
    this.isLoading = false;
  }

  async createNewChat(title = 'New Chat') {
    try {
      const user = supabaseManager.getCurrentUser();
      
      if (!user) {
        this.currentChatId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        this.messages = [];
        return { success: true, chatId: this.currentChatId };
      }

      const result = await supabaseManager.createChat(user.id, title);
      
      if (result.success) {
        this.currentChatId = result.chatId;
        this.messages = [];
        return result;
      }
      
      throw new Error(result.error);
    } catch (error) {
      console.error('Create chat error:', error);
      return { success: false, error: error.message };
    }
  }

  async loadChat(chatId) {
    try {
      const user = supabaseManager.getCurrentUser();
      
      if (!user) {
        this.currentChatId = chatId;
        return { success: true, messages: [] };
      }

      const result = await supabaseManager.getChatHistory(user.id, chatId);
      
      if (result.success) {
        this.currentChatId = chatId;
        this.messages = result.messages || [];
        return result;
      }
      
      throw new Error(result.error);
    } catch (error) {
      console.error('Load chat error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendMessage(userMessage) {
    try {
      if (!userMessage.trim()) {
        return { success: false, error: 'Message cannot be empty' };
      }

      if (!this.currentChatId) {
        const chatResult = await this.createNewChat();
        if (!chatResult.success) {
          throw new Error(chatResult.error);
        }
      }

      this.isLoading = true;

      const userMsg = {
        id: 'msg_' + Date.now(),
        content: userMessage,
        sender: 'user',
        model: aiManager.getCurrentModel().name,
        timestamp: new Date().toISOString(),
      };
      this.messages.push(userMsg);

      const user = supabaseManager.getCurrentUser();
      if (user) {
        // Non-blocking save
        supabaseManager.saveChatMessage(
          user.id,
          this.currentChatId,
          userMessage,
          'user',
          aiManager.getCurrentModel().name
        ).catch(err => console.warn('Supabase save error:', err));
      }

      const aiResponse = await aiManager.sendMessage(userMessage, this.messages);

      if (!aiResponse.success) {
        this.isLoading = false;
        return aiResponse;
      }

      const assistantMsg = {
        id: 'msg_' + Date.now() + '_ai',
        content: aiResponse.message,
        sender: 'assistant',
        model: aiResponse.model,
        timestamp: new Date().toISOString(),
      };
      this.messages.push(assistantMsg);

      if (user) {
        // Non-blocking save
        supabaseManager.saveChatMessage(
          user.id,
          this.currentChatId,
          aiResponse.message,
          'assistant',
          aiResponse.model
        ).catch(err => console.warn('Supabase save error:', err));

        if (this.messages.length === 2) {
          const title = userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : '');
          supabaseManager.updateChat(this.currentChatId, { title }).catch(err => console.warn('Supabase update error:', err));
        }
      }

      this.isLoading = false;

      return {
        success: true,
        message: assistantMsg,
      };
    } catch (error) {
      console.error('Send message error:', error);
      this.isLoading = false;
      return { success: false, error: error.message };
    }
  }

  getMessages() {
    return this.messages;
  }

  getCurrentChatId() {
    return this.currentChatId;
  }

  isLoading_() {
    return this.isLoading;
  }

  clearMessages() {
    this.messages = [];
  }

  async deleteCurrentChat() {
    try {
      const user = supabaseManager.getCurrentUser();
      
      if (user && this.currentChatId) {
        await supabaseManager.deleteChat(this.currentChatId);
      }

      this.currentChatId = null;
      this.messages = [];
      return { success: true };
    } catch (error) {
      console.error('Delete chat error:', error);
      return { success: false, error: error.message };
    }
  }
}

const chatManager = new ChatManager();
