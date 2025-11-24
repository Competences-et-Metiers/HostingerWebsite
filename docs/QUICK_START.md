# CV Generator - Quick Start ⚡

## 🚀 Get Started in 3 Steps

### Step 1: Get Mistral API Key (2 minutes)

1. Go to https://console.mistral.ai/
2. Sign up or log in
3. Create an API key
4. Copy it

### Step 2: Configure (30 seconds)

Set your Mistral API key as a Supabase secret:

```bash
# Set the secret (local development)
supabase secrets set MISTRAL_API_KEY=paste_your_key_here

# Verify it's set
supabase secrets list
```

### Step 3: Run (1 minute)

```bash
# Terminal 1 - Start Supabase (if not already running)
cd supabase
supabase start

# Terminal 2 - Start React app
npm run dev
```

## ✅ That's it!

Navigate to the CV Generator page in your app and start generating CVs!

---

## 📝 How to Use

1. Log in to your account
2. Go to CV Generator page
3. Enter your work experience, education, skills, etc. in the text box
4. Click "Générer le CV"
5. Copy or download your professional CV!

---

## 🆘 Need Help?

- **Detailed setup**: See `SETUP_CV_GENERATOR.md`
- **Implementation details**: See `CV_GENERATOR_IMPLEMENTATION.md`
- **Function docs**: See `supabase/functions/generate-cv/README.md`

---

## 🎯 Example Input

```
I'm a Senior Full Stack Developer with 5 years of experience.

Work Experience:
- Senior Developer at TechCorp (2020-Present)
- Junior Developer at StartupXYZ (2018-2020)

Education:
- Master's in Computer Science, University of Paris

Skills:
- JavaScript, React, Node.js, Python
- PostgreSQL, MongoDB, AWS
- Agile, CI/CD, Docker

Certifications:
- AWS Solutions Architect
```

The AI will generate a professional CV with all proper sections and formatting!

---

**Questions?** Everything is documented in the files above. Happy CV generating! 🎉

