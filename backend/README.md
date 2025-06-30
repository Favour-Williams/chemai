# Chemistry Platform Backend API

A comprehensive Node.js Express TypeScript backend for a chemistry learning platform with PubChem integration and AI chat capabilities.

## 🚀 Features

### Core Features
- **Authentication System**: JWT-based authentication with bcrypt password hashing
- **Element Database**: Complete periodic table data with detailed information
- **Reaction Management**: Create, read, update, and delete chemical reactions
- **Safety Information**: Comprehensive safety data for chemical elements

### Advanced Features
- **PubChem Integration**: Real chemical data from PubChem's free API
- **AI Chat System**: Chemistry-focused chatbot using Hugging Face and Cohere APIs
- **Intelligent Caching**: Reduces API calls and improves performance
- **Rate Limiting**: Protection against abuse with configurable limits
- **Error Handling**: Comprehensive error handling and logging

### Technical Features
- **TypeScript**: Full TypeScript support with strict type checking
- **CORS Support**: Configured for frontend communication
- **Input Validation**: Robust validation for all API endpoints
- **Compression**: Response compression for better performance

## 🔧 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Development**
   ```bash
   npm run dev
   ```

4. **Production Build**
   ```bash
   npm run build
   npm start
   ```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Enhanced Elements (with PubChem Integration)
- `GET /api/elements` - Get all elements
  - Query params: `enhanced=true` for PubChem data
- `GET /api/elements/:symbol` - Get element by symbol
  - Query params: `enhanced=true` for PubChem data
- `GET /api/elements/search` - Search elements
  - Query params: `q`, `category`, `group`, `period`, `enhanced`
- `GET /api/elements/categories` - Get element categories
- `GET /api/elements/compounds/search` - Search compounds via PubChem
  - Query params: `q` (required), `limit`
- `GET /api/elements/compounds/:name` - Get compound by name

### AI Chat System
- `POST /api/chat/message` - Send message to AI
  ```json
  {
    "message": "What is the atomic number of carbon?",
    "conversationId": "optional-uuid",
    "context": {
      "element": "C",
      "topic": "atomic structure"
    }
  }
  ```
- `GET /api/chat/conversations` - Get user's conversations
- `GET /api/chat/conversations/:id` - Get specific conversation
- `DELETE /api/chat/conversations/:id` - Delete conversation
- `POST /api/chat/conversations/:conversationId/messages/:messageId/rate` - Rate AI response

### Reactions
- `GET /api/reactions` - Get all reactions
- `GET /api/reactions/:id` - Get reaction by ID
- `POST /api/reactions` - Create new reaction (auth required)
- `PUT /api/reactions/:id` - Update reaction (auth required)
- `DELETE /api/reactions/:id` - Delete reaction (auth required)
- `GET /api/reactions/search` - Search reactions

### Safety
- `GET /api/safety` - Get all safety data
- `GET /api/safety/:symbol` - Get safety data for element

### Admin Endpoints
- `GET /api/elements/admin/cache/stats` - Get cache statistics
- `POST /api/elements/admin/cache/clear` - Clear PubChem cache
- `GET /api/chat/admin/stats` - Get chat statistics
- `POST /api/chat/admin/cache/clear` - Clear AI chat cache

## 🔑 Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5173

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# Rate Limiting
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# AI Chat APIs (Optional)
HUGGINGFACE_API_TOKEN=your-huggingface-token
COHERE_API_TOKEN=your-cohere-token
```

## 🧪 PubChem Integration

### Features
- **Real Chemical Data**: Access to millions of compounds and elements
- **Intelligent Caching**: 24-hour cache to reduce API calls
- **Error Handling**: Graceful fallback to local data
- **Rate Limiting**: Respects PubChem's rate limits

### Usage Examples

```bash
# Get enhanced element data
GET /api/elements/H?enhanced=true

# Search compounds
GET /api/elements/compounds/search?q=caffeine&limit=5

# Get specific compound
GET /api/elements/compounds/water
```

## 🤖 AI Chat System

### Supported APIs
1. **Hugging Face Inference API** (Primary)
   - Model: microsoft/DialoGPT-large
   - Free tier available
   
2. **Cohere API** (Fallback)
   - Model: command-light
   - Free tier available

3. **Rule-based Fallback** (Always available)
   - Chemistry-specific responses
   - No API key required

### Features
- **Context-Aware**: Understands element and reaction context
- **Conversation Memory**: Maintains conversation history
- **Response Rating**: Users can rate AI responses
- **Intelligent Caching**: Reduces API calls for similar questions

### Usage Example

```bash
POST /api/chat/message
{
  "message": "What happens when sodium reacts with water?",
  "context": {
    "element": "Na",
    "topic": "chemical reactions"
  }
}
```

## 📊 Database Structure

### JSON Collections
- **users.json**: User accounts and preferences
- **elements.json**: Periodic table data
- **reactions.json**: Chemical reactions database
- **chat-history.json**: User chat conversations
- **safety-data.json**: Element safety information

### Caching System
- **PubChem Cache**: 24-hour cache for element/compound data
- **AI Chat Cache**: 1-hour cache for AI responses
- **Automatic Cleanup**: Expired cache entries are automatically removed

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable rounds
- **Rate Limiting**: Configurable limits for API and auth endpoints
- **Input Validation**: Comprehensive validation using express-validator
- **CORS Protection**: Configurable CORS settings
- **Helmet Security**: Security headers via Helmet middleware
- **Request Size Limits**: Protection against large payloads

## 🚀 Performance Features

- **Response Compression**: Gzip compression for all responses
- **Intelligent Caching**: Multi-layer caching system
- **Connection Pooling**: Efficient database connections
- **Error Handling**: Graceful error handling with fallbacks
- **Logging**: Comprehensive logging with Morgan

## 📈 Monitoring & Analytics

### Cache Statistics
```bash
GET /api/elements/admin/cache/stats
GET /api/chat/admin/stats
```

### Available Metrics
- Cache hit/miss ratios
- API response times
- User conversation statistics
- Error rates and types

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Lint code
npm run lint

# Run tests
npm test
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── routes/          # API routes
│   ├── services/        # External API services
│   ├── types/           # TypeScript type definitions
│   └── server.ts        # Main server file
├── data/                # JSON database files
├── backups/             # Database backups
└── dist/                # Compiled JavaScript (production)
```

## 🔗 External APIs

### PubChem REST API
- **Base URL**: `https://pubchem.ncbi.nlm.nih.gov/rest/pug`
- **Rate Limits**: 5 requests/second, 400 requests/minute
- **Cost**: Free
- **Documentation**: [PubChem API Docs](https://pubchemdocs.ncbi.nlm.nih.gov/pug-rest)

### Hugging Face Inference API
- **Model**: microsoft/DialoGPT-large
- **Rate Limits**: Varies by plan
- **Cost**: Free tier available
- **Documentation**: [Hugging Face API Docs](https://huggingface.co/docs/api-inference)

### Cohere API
- **Model**: command-light
- **Rate Limits**: 100 requests/minute (free tier)
- **Cost**: Free tier available
- **Documentation**: [Cohere API Docs](https://docs.cohere.ai/)

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the API documentation at `/api/health`
- Review the comprehensive error messages in responses