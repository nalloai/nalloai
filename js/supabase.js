// Supabase Integration Module
class SupabaseManager {
  constructor() {
    this.client = null;
    this.user = null;
    this.isInitialized = false;
  }

  async init() {
    try {
      const { url, anonKey } = NALLO_CONFIG.supabase;
      
      if (!window.supabase) {
        console.error('Supabase library not loaded');
        return false;
      }

      this.client = window.supabase.createClient(url, anonKey);
      
      const { data: { user }, error } = await this.client.auth.getUser();
      
      if (error) {
        console.log('No existing session:', error.message);
      } else if (user) {
        this.user = user;
        console.log('User session restored:', user.email);
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Supabase initialization error:', error);
      return false;
    }
  }

  async signUp(email, password, fullName) {
    try {
      if (!this.client) throw new Error('Supabase not initialized');

      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        await this.createUserProfile(data.user.id, fullName, email);
      }

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  }

  async signIn(email, password) {
    try {
      if (!this.client) throw new Error('Supabase not initialized');

      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      this.user = data.user;
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  }

  async signOut() {
    try {
      if (!this.client) throw new Error('Supabase not initialized');

      const { error } = await this.client.auth.signOut();
      if (error) throw error;

      this.user = null;
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  }

  async createUserProfile(userId, fullName, email) {
    try {
      if (!this.client) throw new Error('Supabase not initialized');

      const { error } = await this.client.from('user_profiles').insert([
        {
          id: userId,
          full_name: fullName,
          email: email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Create user profile error:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserProfile(userId) {
    try {
      if (!this.client) throw new Error('Supabase not initialized');

      const { data, error } = await this.client
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { success: true, profile: data };
    } catch (error) {
      console.error('Get user profile error:', error);
      return { success: false, error: error.message };
    }
  }

  async updateUserProfile(userId, updates) {
    try {
      if (!this.client) throw new Error('Supabase not initialized');

      const { error } = await this.client
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Update user profile error:', error);
      return { success: false, error: error.message };
    }
  }

  async saveChatMessage(userId, chatId, message, sender, model) {
    try {
      if (!this.client) throw new Error('Supabase not initialized');

      const { error } = await this.client.from('chat_messages').insert([
        {
          chat_id: chatId,
          user_id: userId,
          content: message,
          sender: sender,
          model: model,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Save chat message error:', error);
      return { success: false, error: error.message };
    }
  }

  async getChatHistory(userId, chatId, limit = 50) {
    try {
      if (!this.client) throw new Error('Supabase not initialized');

      const { data, error } = await this.client
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return { success: true, messages: data };
    } catch (error) {
      console.error('Get chat history error:', error);
      return { success: false, error: error.message };
    }
  }

  async createChat(userId, title) {
    try {
      if (!this.client) throw new Error('Supabase not initialized');

      const chatId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      const { error } = await this.client.from('chats').insert([
        {
          id: chatId,
          user_id: userId,
          title: title || 'New Chat',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      return { success: true, chatId };
    } catch (error) {
      console.error('Create chat error:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserChats(userId, limit = 20) {
    try {
      if (!this.client) throw new Error('Supabase not initialized');

      const { data, error } = await this.client
        .from('chats')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { success: true, chats: data };
    } catch (error) {
      console.error('Get user chats error:', error);
      return { success: false, error: error.message };
    }
  }

  async updateChat(chatId, updates) {
    try {
      if (!this.client) throw new Error('Supabase not initialized');

      const { error } = await this.client
        .from('chats')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', chatId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Update chat error:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteChat(chatId) {
    try {
      if (!this.client) throw new Error('Supabase not initialized');

      await this.client.from('chat_messages').delete().eq('chat_id', chatId);

      const { error } = await this.client.from('chats').delete().eq('id', chatId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Delete chat error:', error);
      return { success: false, error: error.message };
    }
  }

  getCurrentUser() {
    return this.user;
  }

  isAuthenticated() {
    return !!this.user;
  }

  async getSession() {
    try {
      if (!this.client) return null;
      const { data: { session } } = await this.client.auth.getSession();
      return session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }
}

const supabaseManager = new SupabaseManager();

document.addEventListener('DOMContentLoaded', async () => {
  await supabaseManager.init();
});
