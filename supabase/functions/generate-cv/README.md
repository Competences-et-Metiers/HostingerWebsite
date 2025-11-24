# CV Generator Function

This Supabase Edge Function generates a professional CV using Mistral AI based on user data and custom instructions.

## Features

- Uses Mistral AI's API to generate professional CVs
- Extracts user email and phone from JWT authentication
- Accepts additional instructions from the user
- Returns plain text CV formatted professionally

## Setup

### 1. Get Mistral API Key

1. Visit [Mistral AI Console](https://console.mistral.ai/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key

### 2. Configure Supabase Secret

Supabase Edge Functions use **Supabase Secrets** for secure credential management.

For local development:

```bash
# Set the secret
supabase secrets set MISTRAL_API_KEY=your_actual_mistral_api_key

# Verify it's set
supabase secrets list

# If using multiple secrets, you can use a .env.local file
echo "MISTRAL_API_KEY=your_key" > ../../../.env.local
supabase secrets set --env-file ../../../.env.local
```

For production (Supabase Cloud):

```bash
# Via CLI (requires project ref)
supabase secrets set MISTRAL_API_KEY=your_actual_mistral_api_key --project-ref your-project-ref

# Or via Supabase Dashboard
# 1. Go to Project Settings → Edge Functions → Secrets
# 2. Add MISTRAL_API_KEY
# 3. Save
```

**Important**: The function code already uses `Deno.env.get("MISTRAL_API_KEY")` which automatically reads from Supabase Secrets.

## Usage

### From Frontend

```javascript
import { supabase } from '@/lib/customSupabaseClient';

const { data, error } = await supabase.functions.invoke('generate-cv', {
  body: {
    additionalInstructions: 'Your experience, education, skills, etc.'
  }
});

if (data && data.cv) {
  console.log('Generated CV:', data.cv);
}
```

### Request Body

```json
{
  "additionalInstructions": "Optional string with user's work experience, education, skills, etc."
}
```

### Response

```json
{
  "cv": "Generated CV content in plain text...",
  "userEmail": "user@example.com",
  "timestamp": "2025-11-24T12:00:00.000Z"
}
```

## Model Used

- **Model**: `mistral-small-latest`
- **Temperature**: 0.7 (balanced creativity and consistency)
- **Max Tokens**: 2000 (suitable for a comprehensive CV)

## CORS Configuration

Allowed origins are configured in the function. Update the `ALLOWED_ORIGINS` array to include your production domain.

## Testing Locally

```bash
# Start Supabase local development
supabase start

# Test the function
curl -X POST 'http://127.0.0.1:54321/functions/v1/generate-cv' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"additionalInstructions": "5 years experience in web development..."}'
```

## Error Handling

The function handles various error cases:
- Missing authentication
- Missing Mistral API key
- Mistral API failures
- Invalid request format

All errors return appropriate HTTP status codes and error messages.

