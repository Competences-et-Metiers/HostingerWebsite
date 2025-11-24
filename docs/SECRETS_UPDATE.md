# ✅ Update: Using Supabase Secrets (Not .env Files)

## Important Change

The CV Generator now uses **Supabase Secrets** for API key management instead of `.env` files. This is the recommended and secure approach for Supabase Edge Functions.

## What Changed

### ❌ Old Approach (Not Recommended)
```bash
# supabase/.env
MISTRAL_API_KEY=your_key_here
```

### ✅ New Approach (Recommended)
```bash
# Use Supabase secrets
supabase secrets set MISTRAL_API_KEY=your_key_here
```

## Why This Change?

### Supabase Secrets Are Better Because:

1. **🔒 More Secure**: Encrypted at rest and in transit
2. **🎯 Purpose-Built**: Designed specifically for Supabase Edge Functions
3. **🔄 Environment Separation**: Easy to manage dev vs production
4. **✅ Best Practice**: Official Supabase recommendation
5. **🚫 No Git Risk**: No risk of accidentally committing secrets
6. **📊 Better Control**: Centralized secret management

## How to Set Up (Updated)

### Quick Setup (30 seconds)

```bash
# 1. Set your Mistral API key as a Supabase secret
supabase secrets set MISTRAL_API_KEY=your_mistral_api_key_here

# 2. Verify it's set
supabase secrets list

# 3. Restart Supabase (if already running)
supabase stop
supabase start

# 4. Start your app
npm run dev
```

### That's It! ✨

The edge function code already uses `Deno.env.get()` which automatically reads from Supabase Secrets.

## For Production

Deploy to Supabase Cloud:

```bash
# Set secret for production
supabase secrets set MISTRAL_API_KEY=your_key --project-ref your-project-ref

# Deploy function
supabase functions deploy generate-cv
```

Or use the Supabase Dashboard:
- Go to **Project Settings** → **Edge Functions** → **Secrets**
- Add `MISTRAL_API_KEY`

## Migration (If You Were Using .env)

If you previously created a `.env` file, you can migrate:

```bash
# 1. Copy your API key from the .env file
# 2. Set it as a Supabase secret
supabase secrets set MISTRAL_API_KEY=your_key_from_env_file

# 3. Delete the .env file (optional - it's already gitignored)
rm supabase/.env

# 4. Restart Supabase
supabase stop && supabase start
```

## Reference Documentation

All documentation has been updated:

- ✅ `QUICK_START.md` - Updated quick start guide
- ✅ `SETUP_CV_GENERATOR.md` - Updated detailed setup
- ✅ `CV_GENERATOR_IMPLEMENTATION.md` - Updated implementation details
- ✅ `supabase/SECRETS.md` - **NEW** - Comprehensive secrets guide
- ✅ `supabase/functions/generate-cv/README.md` - Updated function docs

## Troubleshooting

### Function Can't Find API Key

```bash
# 1. Check if secret is set
supabase secrets list

# 2. If not listed, set it
supabase secrets set MISTRAL_API_KEY=your_key

# 3. Restart Supabase
supabase stop && supabase start

# 4. Test the function
# (Navigate to CV Generator page and try generating a CV)
```

### Still Have Questions?

See the comprehensive guide: `supabase/SECRETS.md`

## Summary

✅ **What to do**: Use `supabase secrets set MISTRAL_API_KEY=your_key`  
❌ **What NOT to do**: Create `.env` files with API keys  
📖 **Documentation**: All updated to reflect Supabase Secrets  
🔒 **Security**: Much better with Supabase Secrets  

---

**Ready to go!** Just set your secret and start generating CVs. 🚀

