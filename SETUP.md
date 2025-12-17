# Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

Or use the convenience script:
```bash
npm run install-all
```

### 2. Set Up Supabase

#### Create Supabase Project

1. Go to https://supabase.com and create a new project
2. Wait for the project to be fully provisioned (2-3 minutes)

#### Configure Database

1. Go to **SQL Editor** in your Supabase dashboard
2. Run the contents of `backend/config/database.sql`:
   - This creates all tables (users, pdfs, pdf_chunks, tags)
   - Sets up Row Level Security policies
   - Creates indexes

3. Run the contents of `backend/config/supabase_functions.sql`:
   - This creates the `match_pdf_chunks` RPC function for vector search

4. Enable pgvector extension:
   - Go to **Database** → **Extensions**
   - Search for `vector`
   - Click **Enable**

#### Create Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **New bucket**
3. Name: `pdfs`
4. **Public bucket**: No (unchecked)
5. Click **Create bucket**

6. Set up storage policies (optional, RLS handles this):
   - Go to **Storage** → **Policies**
   - Create policy to allow authenticated users to upload/read their own files

#### Get API Keys

1. Go to **Project Settings** → **API**
2. Copy the following:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development

JWT_SECRET=your-super-secret-jwt-key-min-32-chars-change-in-production
JWT_EXPIRES_IN=7d

SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

OPENAI_API_KEY=sk-...
```

**Important**: 
- Generate a strong `JWT_SECRET` (at least 32 characters)
- Never commit `.env` to git
- The service role key bypasses RLS - keep it secret!

### 4. Get OpenAI API Key (for Q&A)

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add it to your `.env` file as `OPENAI_API_KEY`

**Note**: Q&A requires OpenAI API. Semantic search works without it.

### 5. Run the Application

```bash
# Run both backend and frontend
npm run dev

# Or separately:
npm run server    # Backend: http://localhost:5000
npm run client    # Frontend: http://localhost:3000
```

## Verification Steps

### 1. Check Backend

Visit http://localhost:5000/api/health
- Should return: `{"status":"ok","message":"AI PDF Organizer API is running"}`

### 2. Test Authentication

```bash
# Sign up
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 3. Test PDF Upload

1. Open http://localhost:3000
2. Sign up/login
3. Upload a PDF file
4. Wait for processing (first upload takes longer due to model loading)

### 4. Test Semantic Search

1. After uploading a PDF, use the search bar
2. Try queries like:
   - "financial information"
   - "research methodology"
   - "key findings"

### 5. Test Q&A

1. Ask a question about your uploaded PDF
2. Example: "What is the main topic of this document?"

## Troubleshooting

### Model Loading Takes Long

- First time loading Xenova model downloads ~90MB
- Subsequent loads are faster (cached)
- This is normal behavior

### "pgvector extension not found"

- Make sure you enabled the `vector` extension in Supabase
- Check Database → Extensions

### "RPC function not found"

- Run `backend/config/supabase_functions.sql` in SQL Editor
- Check that the function `match_pdf_chunks` exists

### "Storage bucket not found"

- Create the `pdfs` bucket in Supabase Storage
- Check bucket name matches exactly: `pdfs`

### "OPENAI_API_KEY required"

- Q&A feature requires OpenAI API key
- Semantic search works without it
- Add key to `.env` file

### CORS Errors

- Make sure backend is running on port 5000
- Frontend proxy is configured in `frontend/package.json`
- Check browser console for specific errors

### Embedding Generation Fails

- Check internet connection (first-time model download)
- Verify Xenova Transformers installed: `npm list @xenova/transformers`
- Check Node.js version (18+ required)

## Production Deployment

### Environment Variables

- Use environment-specific `.env` files
- Use secrets management (AWS Secrets Manager, etc.)
- Never commit secrets to git

### Database

- Use connection pooling
- Set up database backups
- Monitor query performance

### Storage

- Configure CDN for PDF files
- Set up file retention policies
- Monitor storage usage

### Security

- Use strong JWT_SECRET (32+ random characters)
- Enable HTTPS
- Set up rate limiting
- Add request validation
- Implement file virus scanning

## Next Steps

- Read `README.md` for feature overview
- Read `ARCHITECTURE.md` for technical details
- Customize tag categories in `backend/services/aiTagging.js`
- Adjust chunk size in `backend/services/pdfExtractor.js`
- Tune similarity thresholds in search/QA routes

