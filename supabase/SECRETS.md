# Supabase Secrets Management

This document explains how to manage secrets for Supabase Edge Functions in this project.

## Overview

Supabase Edge Functions use **Supabase Secrets** for secure credential management. Secrets are:
- ✅ Encrypted at rest and in transit
- ✅ Never exposed to client-side code
- ✅ Accessible only within Edge Functions via `Deno.env.get()`
- ✅ Separate for local development and production

## Required Secrets

### MISTRAL_API_KEY

**Purpose**: API key for Mistral AI to generate CVs

**Required by**: `generate-cv` function

**How to get**:
1. Visit https://console.mistral.ai/
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key
5. Copy the key

### DENDREO_API_KEY

**Purpose**: API key for Dendreo platform integration (already configured)

**Required by**: `get-adf`, `adf-consultants`, `adf-competencies`, etc.

## Setting Secrets

### Local Development

#### Option 1: Set Individual Secret

```bash
# Navigate to your project root
cd c:/Projects/HostingerWeb

# Set the secret
supabase secrets set MISTRAL_API_KEY=your_actual_api_key_here

# Verify it's set
supabase secrets list
```

#### Option 2: Use .env.local File (Recommended for Multiple Secrets)

```bash
# Create supabase/.env.local file
cat > supabase/.env.local << EOF
MISTRAL_API_KEY=your_mistral_api_key_here
DENDREO_API_KEY=your_dendreo_api_key_here
EOF

# Load all secrets from file
supabase secrets set --env-file supabase/.env.local

# Verify they're set
supabase secrets list
```

**Important**: The `.env.local` file is already in `.gitignore` - never commit it!

#### Restart Supabase After Setting Secrets

```bash
supabase stop
supabase start
```

### Production (Supabase Cloud)

#### Option 1: Using Supabase CLI

```bash
# Link your project (first time only)
supabase link --project-ref your-project-ref

# Set secret
supabase secrets set MISTRAL_API_KEY=your_actual_api_key_here --project-ref your-project-ref

# Or set multiple secrets
supabase secrets set MISTRAL_API_KEY=key1 OTHER_SECRET=key2 --project-ref your-project-ref
```

#### Option 2: Using Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
4. Click **Add Secret**
5. Enter:
   - **Name**: `MISTRAL_API_KEY`
   - **Value**: Your actual Mistral API key
6. Click **Save**
7. Repeat for any other secrets

## Viewing Secrets

### Local Development

```bash
# List all secret names (values are hidden)
supabase secrets list

# Unset a secret
supabase secrets unset SECRET_NAME
```

### Production

```bash
# List secrets for production project
supabase secrets list --project-ref your-project-ref
```

Or use the Supabase Dashboard (Settings → Edge Functions → Secrets).

## Using Secrets in Edge Functions

Secrets are accessed via `Deno.env.get()` in your Edge Functions:

```typescript
// supabase/functions/generate-cv/index.ts
const mistralApiKey = Deno.env.get("MISTRAL_API_KEY");

if (!mistralApiKey) {
  return new Response(
    JSON.stringify({ error: "Mistral API key not configured" }),
    { status: 500 }
  );
}

// Use the API key
const response = await fetch("https://api.mistral.ai/v1/...", {
  headers: {
    "Authorization": `Bearer ${mistralApiKey}`,
  },
});
```

## Best Practices

### ✅ DO

- Use `supabase secrets set` for all API keys and sensitive credentials
- Keep separate secrets for development and production
- Add `.env.local`, `.env`, and similar files to `.gitignore`
- Restart Supabase after setting/changing secrets locally
- Document required secrets in this file
- Use descriptive secret names in UPPER_SNAKE_CASE
- Rotate secrets periodically

### ❌ DON'T

- Never commit `.env.local` or `.env` files to git
- Never hardcode API keys in your code
- Never expose secrets in client-side code
- Never share secrets via insecure channels (email, Slack, etc.)
- Never log secret values
- Never use production secrets in local development

## Troubleshooting

### "API key not configured" Error

1. **Check if secret is set**:
   ```bash
   supabase secrets list
   ```

2. **If not listed, set it**:
   ```bash
   supabase secrets set MISTRAL_API_KEY=your_key
   ```

3. **Restart Supabase**:
   ```bash
   supabase stop
   supabase start
   ```

4. **Test the function**:
   ```bash
   curl -X POST 'http://127.0.0.1:54321/functions/v1/generate-cv' \
     -H 'Authorization: Bearer YOUR_JWT' \
     -H 'Content-Type: application/json' \
     -d '{"additionalInstructions": "test"}'
   ```

### Secret Not Working After Setting

- **Local**: Restart Supabase (`supabase stop && supabase start`)
- **Production**: Redeploy the function (`supabase functions deploy generate-cv`)
- Check for typos in secret names (they're case-sensitive)
- Ensure you're setting secrets for the correct environment

### Can't Find Secrets in Dashboard

- Make sure you're in the correct project
- Navigate to: **Project Settings** → **Edge Functions** → **Secrets**
- If the Secrets tab doesn't appear, your Supabase version might be outdated

## Security Notes

🔒 **How Supabase Secrets Work**:

1. **Encryption**: Secrets are encrypted at rest in Supabase's infrastructure
2. **Isolation**: Each project has isolated secrets
3. **Access Control**: Only Edge Functions in your project can access them
4. **No Client Exposure**: Secrets never reach the browser/client
5. **Audit Trail**: Changes to secrets are logged (Enterprise plan)

🔐 **Additional Security**:

- Enable 2FA on your Supabase account
- Use strong, unique API keys
- Rotate secrets regularly (e.g., every 90 days)
- Monitor API usage for anomalies
- Revoke and regenerate if compromised

## Quick Reference

```bash
# Local Development Quick Commands
supabase secrets set MISTRAL_API_KEY=your_key    # Set secret
supabase secrets list                             # List secrets
supabase secrets unset SECRET_NAME                # Remove secret
supabase stop && supabase start                   # Restart with new secrets

# Production Quick Commands
supabase secrets set SECRET=value --project-ref YOUR_REF   # Set for production
supabase secrets list --project-ref YOUR_REF               # List production secrets
supabase functions deploy generate-cv                      # Deploy with updated secrets
```

## Support

For more information:
- [Supabase Secrets Documentation](https://supabase.com/docs/guides/functions/secrets)
- [Edge Functions Best Practices](https://supabase.com/docs/guides/functions)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)

---

**Remember**: Secrets are the keys to your kingdom. Treat them with care! 🔐

