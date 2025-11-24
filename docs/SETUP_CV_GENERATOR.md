# CV Generator Setup Guide

This guide will help you set up and use the CV Generator feature powered by Mistral AI.

## Prerequisites

- Supabase project (local or cloud)
- Mistral AI API key
- User authentication set up (already configured)

## Step 1: Get Your Mistral AI API Key

1. Visit [Mistral AI Console](https://console.mistral.ai/)
2. Sign up for an account or log in
3. Navigate to the API Keys section
4. Create a new API key
5. Copy and save the key securely

## Step 2: Configure the Secret

Supabase Edge Functions use **Supabase Secrets** (not `.env` files). Set your Mistral API key as a secret:

### For Local Development

Option A - Set directly:
```bash
supabase secrets set MISTRAL_API_KEY=your_actual_mistral_api_key_here
```

Option B - Use a local env file (recommended for multiple secrets):
```bash
# Create supabase/.env.local file
echo "MISTRAL_API_KEY=your_actual_mistral_api_key_here" > supabase/.env.local

# Load secrets from file
supabase secrets set --env-file supabase/.env.local
```

**Important**: The `.env.local` file should be gitignored. Never commit API keys to git.

### For Supabase Cloud (Production)

Option A - Using Supabase CLI:
```bash
supabase secrets set MISTRAL_API_KEY=your_actual_mistral_api_key_here --project-ref your-project-ref
```

Option B - Via Supabase Dashboard:
1. Go to your project at https://supabase.com/dashboard
2. Navigate to Project Settings → Edge Functions → Secrets
3. Add a new secret: `MISTRAL_API_KEY` with your API key value
4. Save the secret

## Step 3: Deploy the Edge Function

### For Local Development

Start Supabase locally:

```bash
cd supabase
supabase start
```

The function will be automatically available at:
```
http://127.0.0.1:54321/functions/v1/generate-cv
```

### For Production

Deploy to Supabase Cloud:

```bash
supabase functions deploy generate-cv
```

## Step 4: Test the CV Generator

1. Start your React app:
   ```bash
   npm run dev
   ```

2. Log in to your account

3. Navigate to the CV Generator page

4. Enter additional instructions (optional):
   - Work experience
   - Education
   - Skills
   - Certifications
   - Any other relevant information

5. Click "Générer le CV"

6. Once generated, you can:
   - Copy the CV to clipboard
   - Download it as a text file

## Usage Example

The user provides instructions like:

```
I have 5 years of experience as a Full Stack Developer at TechCorp.
I have a Master's degree in Computer Science from University of Paris.
My skills include:
- JavaScript, TypeScript, React, Node.js
- Python, Django, FastAPI
- PostgreSQL, MongoDB
- AWS, Docker, Kubernetes
- Agile methodologies

I'm certified in AWS Solutions Architect and have led multiple successful projects.
```

The AI will generate a professional CV based on:
- User's email and phone (from authentication)
- The additional instructions provided

## Features

✅ **AI-Powered**: Uses Mistral AI's latest models for high-quality output
✅ **Secure**: JWT authentication required
✅ **Privacy-First**: User data stays with the user
✅ **Easy to Use**: Simple textarea input for instructions
✅ **Export Options**: Copy to clipboard or download as text
✅ **Professional Format**: Well-structured CV sections

## Customization

### Adjust the AI Model

In `supabase/functions/generate-cv/index.ts`, you can modify:

```typescript
model: "mistral-small-latest",  // or "mistral-medium", "mistral-large-latest"
temperature: 0.7,                // 0.0 = deterministic, 1.0 = creative
max_tokens: 2000,                // Maximum length of generated CV
```

### Update CORS Origins

For production, update the `ALLOWED_ORIGINS` array in the edge function:

```typescript
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://yourdomain.com"  // Add your production domain
];
```

## Troubleshooting

### "Mistral API key not configured" Error

- Ensure the `MISTRAL_API_KEY` secret is set using `supabase secrets set`
- For local development: Run `supabase secrets list` to verify
- For production: Check Supabase Dashboard → Project Settings → Edge Functions → Secrets
- After setting secrets, restart Supabase: `supabase stop` then `supabase start`

### "User authentication required" Error

- Make sure you're logged in
- Check that the JWT token is being sent with the request
- Verify `verify_jwt = true` in `supabase/config.toml`

### Function Not Found

- Ensure the function is deployed: `supabase functions deploy generate-cv`
- Check that the function is enabled in `supabase/config.toml`
- Restart Supabase locally if needed: `supabase stop` then `supabase start`

### API Rate Limits

Mistral AI has rate limits based on your plan. If you encounter rate limit errors:
- Wait a few moments before trying again
- Consider upgrading your Mistral AI plan
- Implement client-side rate limiting

## Cost Considerations

Mistral AI charges based on tokens used:
- Input tokens: The prompt sent to the API
- Output tokens: The generated CV text

The current configuration (max_tokens: 2000) is optimized for comprehensive CVs while being cost-effective.

## Future Enhancements

Potential improvements for later versions:

- [ ] PDF export functionality
- [ ] Multiple CV templates/styles
- [ ] Save CV history
- [ ] Integration with user profile data from database
- [ ] CV editing capabilities
- [ ] Multiple language support
- [ ] Custom section ordering

## Support

For issues or questions:
1. Check the function logs: `supabase functions logs generate-cv`
2. Review the [Mistral AI Documentation](https://docs.mistral.ai/)
3. Check the [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)

## Security Notes

⚠️ **Important Security Reminders**:
- Always use Supabase Secrets for API keys (never hardcode them)
- Never commit `.env.local` files to git (add to `.gitignore`)
- Never expose your Mistral API key in client-side code
- Always use Supabase Edge Functions for API key operations
- JWT verification is enabled by default (keep it that way)
- Secrets are encrypted at rest and in transit by Supabase

---

**Ready to generate your first CV?** Just follow the steps above and you'll be up and running in minutes! 🚀

