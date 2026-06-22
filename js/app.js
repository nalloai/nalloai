// Main Application Logic
class NalloApp {
  constructor() {
    this.currentUser = null;
    this.isGuest = false;
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    document.getElementById('login-btn').addEventListener('click', () => this.handleLogin());
    document.getElementById('signup-btn').addEventListener('click', () => this.handleSignup());
    document.getElementById('guest-btn').addEventListener('click', () => this.handleGuestLogin());
    document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());

    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchAuthTab(e.target.dataset.tab));
    });

    document.getElementById('send-btn').addEventListener('click', () => this.sendMessage());
    document.getElementById('chat-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    document.getElementById('chat-input').addEventListener('input', (e) => {
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    });

    document.querySelectorAll('.model-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.selectModel(e.currentTarget));
    });

    document.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const prompt = e.target.dataset.prompt;
        document.getElementById('chat-input').value = prompt;
        this.sendMessage();
      });
    });

    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) menuBtn.addEventListener('click', () => this.toggleSidebar());

    const closeBtn = document.getElementById('sidebar-close') || document.getElementById('sidebar-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => this.toggleSidebar());

    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) overlay.addEventListener('click', () => this.toggleSidebar());

    const newChatBtn = document.getElementById('new-chat-btn');
    if (newChatBtn) newChatBtn.addEventListener('click', () => this.startNewChat());

    // Settings removed

    const chatInput = document.getElementById('chat-input');
    chatInput.addEventListener('input', () => {
      const sendBtn = document.getElementById('send-btn');
      sendBtn.disabled = !chatInput.value.trim();
    });
  }

  async handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    if (!email || !password) {
      errorEl.textContent = 'Please fill in all fields';
      return;
    }

    try {
      const result = await supabaseManager.signIn(email, password);
      
      if (result.success) {
        this.currentUser = result.user;
        this.isGuest = false;
        this.showApp();
        this.updateUserDisplay();
      } else {
        errorEl.textContent = result.error || 'Login failed';
      }
    } catch (error) {
      errorEl.textContent = 'An error occurred. Please try again.';
    }
  }

  async handleSignup() {
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const errorEl = document.getElementById('signup-error');
    const successEl = document.getElementById('signup-success');

    errorEl.textContent = '';
    successEl.textContent = '';

    if (!name || !email || !password) {
      errorEl.textContent = 'Please fill in all fields';
      return;
    }

    if (password.length < 6) {
      errorEl.textContent = 'Password must be at least 6 characters';
      return;
    }

    try {
      const result = await supabaseManager.signUp(email, password, name);
      
      if (result.success) {
        successEl.textContent = 'Account created! Please check your email to confirm.';
        document.getElementById('signup-name').value = '';
        document.getElementById('signup-email').value = '';
        document.getElementById('signup-password').value = '';
        
        setTimeout(() => {
          this.switchAuthTab('login');
        }, 2000);
      } else {
        errorEl.textContent = result.error || 'Signup failed';
      }
    } catch (error) {
      errorEl.textContent = 'An error occurred. Please try again.';
    }
  }

  handleGuestLogin() {
    this.currentUser = null;
    this.isGuest = true;
    this.showApp();
    this.updateUserDisplay();
  }

  async handleLogout() {
    if (this.isGuest) {
      this.showAuth();
      return;
    }

    const result = await supabaseManager.signOut();
    if (result.success) {
      this.currentUser = null;
      this.isGuest = false;
      this.showAuth();
    }
  }

  switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.getElementById(`${tab}-form`).classList.add('active');

    document.getElementById('login-error').textContent = '';
    document.getElementById('signup-error').textContent = '';
    document.getElementById('signup-success').textContent = '';
  }

  async sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    document.getElementById('welcome-screen').style.display = 'none';

    this.addMessageToUI(message, 'user');
    input.value = '';
    input.style.height = 'auto';
    document.getElementById('send-btn').disabled = true;

    this.showLoadingIndicator();

    try {
      const result = await chatManager.sendMessage(message);

      this.removeLoadingIndicator();

      if (result.success) {
        this.addMessageToUI(result.message.content, 'assistant');
        this.scrollToBottom();
      } else {
        this.showToast(result.error || 'Failed to get response. Please try again.', 'error');
      }
    } catch (error) {
      this.removeLoadingIndicator();
      this.showToast('An unexpected error occurred. Please try again.', 'error');
      console.error('Send message error:', error);
    }
  }

  addMessageToUI(content, sender) {
    const messagesContainer = document.getElementById('messages');
    const messageEl = document.createElement('div');
    messageEl.className = `message ${sender}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = sender === 'user' ? 'You' : 'AI';

    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';
    
    // Render markdown for AI messages
    if (sender === 'assistant' && typeof marked !== 'undefined') {
      try {
        contentEl.innerHTML = marked.parse(content);
        // Highlight code blocks
        contentEl.querySelectorAll('pre code').forEach((block) => {
          if (typeof hljs !== 'undefined') {
            hljs.highlightElement(block);
          }
        });
      } catch (e) {
        contentEl.textContent = content;
      }
    } else {
      contentEl.textContent = content;
    }

    messageEl.appendChild(avatar);
    messageEl.appendChild(contentEl);
    messagesContainer.appendChild(messageEl);

    this.scrollToBottom();
  }

  showLoadingIndicator() {
    const messagesContainer = document.getElementById('messages');
    const loadingEl = document.createElement('div');
    loadingEl.className = 'message';
    loadingEl.id = 'loading-indicator';
    loadingEl.innerHTML = `
      <div class="message-avatar">AI</div>
      <div class="message-loading">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div class="typing-indicator">Thinking...</div>
    `;
    messagesContainer.appendChild(loadingEl);
    this.scrollToBottom();
  }

  removeLoadingIndicator() {
    const loading = document.getElementById('loading-indicator');
    if (loading) loading.remove();
  }

  scrollToBottom() {
    const container = document.getElementById('chat-container');
    container.scrollTop = container.scrollHeight;
  }

  selectModel(btn) {
    document.querySelectorAll('.model-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const modelId = btn.dataset.model;
    const modelLabel = btn.dataset.label;
    
    aiManager.setCurrentModel(modelId);
    document.getElementById('current-model-name').textContent = modelLabel;

    this.showToast(`Switched to ${modelLabel}`, 'success');
  }

  async startNewChat() {
    // Reset UI
    chatManager.clearMessages();
    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) messagesContainer.innerHTML = '';
    
    const welcomeScreen = document.getElementById('welcome-screen');
    if (welcomeScreen) welcomeScreen.style.display = 'flex';
    
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.value = '';
      chatInput.style.height = 'auto';
    }
    
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) sendBtn.disabled = true;

    // Create new chat in manager/backend
    const result = await chatManager.createNewChat();
    if (!result.success) {
      console.error('New chat creation failed:', result.error);
    }

    // Close sidebar if it's open
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('open')) {
      this.toggleSidebar();
    }
    
    this.loadChatHistory();
    this.showToast('New chat started', 'info');
  }

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar && overlay) {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    }
  }

  // Settings functions removed

  showAuth() {
    document.getElementById('auth-screen').classList.add('active');
    document.getElementById('app-screen').classList.remove('active');
  }

  showApp() {
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('app-screen').classList.add('active');
    
    this.startNewChat();
  }

  updateUserDisplay() {
    const nameEl = document.getElementById('user-name-display');
    const emailEl = document.getElementById('user-email-display');
    const avatarEl = document.getElementById('user-avatar');

    if (this.isGuest) {
      nameEl.textContent = 'Guest';
      emailEl.textContent = 'guest mode';
      avatarEl.textContent = 'G';
    } else if (this.currentUser) {
      const name = this.currentUser.user_metadata?.full_name || this.currentUser.email;
      nameEl.textContent = name;
      emailEl.textContent = this.currentUser.email;
      avatarEl.textContent = name.charAt(0).toUpperCase();
    }
  }

  async loadChatHistory() {
    if (this.isGuest || !this.currentUser) return;

    const historyList = document.getElementById('chat-history-list');
    const result = await supabaseManager.getUserChats(this.currentUser.id);

    if (result.success && result.chats && result.chats.length > 0) {
      historyList.innerHTML = '';
      result.chats.forEach(chat => {
        const item = document.createElement('div');
        item.className = 'chat-history-item';
        item.textContent = chat.title;
        item.addEventListener('click', async () => {
          await chatManager.loadChat(chat.id);
          this.displayChatMessages();
          this.toggleSidebar();
        });
        historyList.appendChild(item);
      });
    } else {
      historyList.innerHTML = '<div class="history-empty">No chats yet. Start a conversation!</div>';
    }
  }

  displayChatMessages() {
    const messagesContainer = document.getElementById('messages');
    messagesContainer.innerHTML = '';
    document.getElementById('welcome-screen').style.display = 'none';

    const messages = chatManager.getMessages();
    messages.forEach(msg => {
      this.addMessageToUI(msg.content, msg.sender);
    });

    // Apply syntax highlighting after rendering
    setTimeout(() => {
      if (typeof hljs !== 'undefined') {
        messagesContainer.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightElement(block);
        });
      }
    }, 100);

    this.scrollToBottom();
  }

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');

    // Longer timeout for error messages
    const timeout = type === 'error' ? 5000 : 3000;
    setTimeout(() => {
      toast.classList.add('hidden');
    }, timeout);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize app immediately without waiting for Supabase
  window.app = new NalloApp();

  // Handle Supabase initialization in the background
  const initSupabase = async () => {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds
    
    const checkInit = setInterval(() => {
      attempts++;
      if (supabaseManager.isInitialized || attempts >= maxAttempts) {
        clearInterval(checkInit);
        
        const user = supabaseManager.getCurrentUser();
        if (user) {
          window.app.currentUser = user;
          window.app.isGuest = false;
          window.app.showApp();
          window.app.updateUserDisplay();
          window.app.loadChatHistory();
        }
      }
    }, 100);
  };

  initSupabase();
});
