# SuperFantastic Backend - Pinata Upload API

Secure backend API for handling IPFS uploads to Pinata for the SuperFantastic NFT minting app.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Pinata account with API keys

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   PINATA_API_KEY=your_api_key_here
   PINATA_SECRET_KEY=your_secret_here
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   ```

3. **Start server:**
   ```bash
   npm start
   ```

4. **Test it:**
   ```bash
   # Check health
   curl http://localhost:3001/health
   
   # Test upload
   node test-upload.js path/to/image.jpg
   ```

## 📡 API Endpoints

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### `POST /api/upload`
Upload image to Pinata IPFS.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form field `image` with image file

**Example using curl:**
```bash
curl -X POST http://localhost:3001/api/upload \
  -F "image=@photo.jpg"
```

**Success Response (200):**
```json
{
  "success": true,
  "ipfsHash": "QmXxx...",
  "ipfsUrl": "ipfs://QmXxx...",
  "gatewayUrl": "https://gateway.pinata.cloud/ipfs/QmXxx...",
  "size": 1234567,
  "timestamp": "2025-10-13T12:00:00.000Z"
}
```

**Error Response (400/500):**
```json
{
  "error": "Error message"
}
```

## 🔐 Security Features

- ✅ API keys stored in environment variables (not in code)
- ✅ CORS configured for specific frontend origin
- ✅ File size limits (10MB max)
- ✅ File type validation (images only)
- ✅ Memory storage (doesn't save files to disk)
- ✅ Multer for secure file handling

## 📦 Dependencies

- **express** - Web framework
- **cors** - CORS middleware
- **multer** - File upload handling
- **dotenv** - Environment variables
- **axios** - HTTP client for Pinata
- **form-data** - Multipart form data

## 🚢 Deployment

### Railway (Recommended)

1. Push to GitHub
2. Connect repository to Railway
3. Add environment variables
4. Deploy automatically

### Render

1. Push to GitHub
2. Create new Web Service
3. Connect repository
4. Add environment variables
5. Deploy

### Environment Variables for Production

```bash
PINATA_API_KEY=your_production_key
PINATA_SECRET_KEY=your_production_secret
FRONTEND_URL=https://your-frontend-domain.com
PORT=3001  # Railway/Render will override this
```

## 🧪 Testing

### Run Test Script
```bash
npm test
# or
node test-upload.js test-image.jpg
```

### Manual Testing with Postman
1. Create new POST request to `http://localhost:3001/api/upload`
2. Body → form-data
3. Add field `image` → type: File → select image
4. Send

## 📊 Rate Limits

Current implementation has no rate limiting. For production, consider adding:

```bash
npm install express-rate-limit
```

Then in `server.js`:
```javascript
const rateLimit = require('express-rate-limit');

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/upload', uploadLimiter);
```

## 🐛 Troubleshooting

### "CORS Error"
**Problem:** Frontend can't access backend
**Solution:** Update `FRONTEND_URL` in `.env` to match your frontend URL

### "401 Unauthorized from Pinata"
**Problem:** Invalid API keys
**Solution:** Double-check your Pinata API keys in `.env`

### "LIMIT_FILE_SIZE"
**Problem:** File too large
**Solution:** File must be under 10MB. Adjust in `server.js` if needed

### "No image file provided"
**Problem:** File not sent correctly
**Solution:** Ensure form field name is `image` (not `file`)

## 📝 File Structure

```
superfantastic-backend/
├── server.js           # Main server file
├── package.json        # Dependencies
├── .env               # Environment variables (git ignored)
├── .gitignore         # Git ignore rules
├── test-upload.js     # Test script
└── README.md          # This file
```

## 🔄 Updates

To update dependencies:
```bash
npm update
```

To check for security vulnerabilities:
```bash
npm audit
npm audit fix
```

## 📞 Support

- Pinata Docs: https://docs.pinata.cloud
- Express Docs: https://expressjs.com
- Multer Docs: https://github.com/expressjs/multer

## 📄 License

MIT