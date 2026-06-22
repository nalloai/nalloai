# Nallo AI

A modern, open-source AI chat interface supporting multiple AI models (GPT-4o Mini, Claude 3.5 Haiku, and Gemini 2.0 Flash) with Supabase integration for chat history and user profiles.

## Features

- **Multi-Model Support**: Switch between 3 different AI models
  - GPT-4o Mini (Fast)
  - Claude 3.5 Haiku (Smart)
  - Gemini 2.0 Flash (Creative)

- **User Authentication**: Secure sign-up and login with Supabase
- **Chat History**: Save and retrieve all conversations
- **User Profiles**: Persistent user data and preferences
- **Guest Mode**: Use without creating an account
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Beautiful gradient design with smooth animations

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Supabase (PostgreSQL + Auth)
- **AI Integration**: OpenAI, Anthropic, Google Gemini APIs
- **Hosting**: GitHub Pages

## Getting Started

### Prerequisites

- A Supabase account (free tier available)
- API keys for AI models (optional - can be added in settings)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/nalloai/nalloai.git
cd nalloai
```

2. Configure Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Get your project URL and API keys
   - Update `js/config.js` with your Supabase credentials

3. (Optional) Add AI API Keys:
   - Get API keys from OpenAI, Anthropic, and Google
   - Add them in the app settings or update `js/config.js`

### Supabase Setup

Create the following tables in your Supabase project:

#### `user_profiles` table
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `chats` table
```sql
CREATE TABLE chats (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `chat_messages` table
```sql
CREATE TABLE chat_messages (
  id BIGSERIAL PRIMARY KEY,
  chat_id TEXT REFERENCES chats(id),
  user_id UUID REFERENCES auth.users(id),
  content TEXT,
  sender TEXT,
  model TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Deployment to GitHub Pages

1. Enable GitHub Pages in your repository settings
2. Set the source to the `main` branch (or your default branch)
3. The site will be available at `https://nalloai.github.io/nalloai`

## Configuration

### API Keys

You can add your API keys in two ways:

1. **In the App Settings**: Click the settings icon and add your keys
2. **In `js/config.js`**: Update the configuration directly

### Supported Models

- **OpenAI**: GPT-4o Mini
- **Anthropic**: Claude 3.5 Haiku
- **Google**: Gemini 2.0 Flash

## Usage

1. **Sign Up or Login**: Create an account or continue as guest
2. **Select a Model**: Choose from the 3 available AI models
3. **Start Chatting**: Type your message and press Enter or click Send
4. **View History**: Access previous chats from the sidebar
5. **Switch Models**: Change models mid-conversation

## File Structure

```
nalloai/
├── index.html           # Main HTML file
├── css/
│   └── style.css       # All styles
├── js/
│   ├── config.js       # Configuration
│   ├── supabase.js     # Supabase integration
│   ├── ai.js           # AI model integration
│   ├── chat.js         # Chat management
│   └── app.js          # Main app logic
├── assets/             # Images and icons
└── README.md           # This file
```

## Security

- API keys are stored locally in browser localStorage
- Sensitive operations use Supabase's secure authentication
- Never commit API keys to the repository
- Use environment variables for production deployment

## Troubleshooting

### "API key not configured"
Add your API keys in the app settings or update `js/config.js`

### "Supabase connection failed"
Check your Supabase URL and API keys in `js/config.js`

### Chat history not saving
Ensure you're logged in and Supabase tables are properly created

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues and questions, please open an issue on GitHub.

## Roadmap

- [ ] Voice input/output
- [ ] Image generation
- [ ] Code syntax highlighting
- [ ] Export chats as PDF
- [ ] Dark/Light theme toggle
- [ ] More AI models
- [ ] Conversation sharing
- [ ] Prompt templates

---

Made with ❤️ by the Nallo AI team
