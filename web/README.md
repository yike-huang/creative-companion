# Creative Companion

Creative Companion is a non-clinical, AI-assisted web application designed to support private emotional reflection and art-inspired coping activities for cancer patients and survivors.

The project combines daily emotion check-ins, diary reflection, curated resources, AI-assisted activity recommendations, and digital or offline artwork creation. It is built as a research and prototype system, not as medical care, psychotherapy, art therapy, crisis support, or emergency care.

## Current Status

Creative Companion is currently an active prototype. It includes core user flows for authentication, reflection, recommendation, artwork creation, consent management, and crisis-resource display. The system is suitable for demonstration, design review, and continued research development, but it should not be treated as a validated clinical or therapeutic intervention.

## Features

- Account creation and sign-in with email or Google OAuth
- Profile setup with limited background information
- Consent-centered settings for AI reflection, data storage, and related support features
- Daily emotion diary entries with optional emotion labels
- AI-assisted, non-diagnostic emotion reflection
- Personalized art-inspired activity recommendations based on user context, diary reflections, consent settings, and curated sources
- Retrieval-Augmented Generation (RAG) support using curated mental health, cancer support, and art-related resources
- User-facing source links and optional research links for recommendation context
- Digital artwork canvas with multiple tools, brushes, color controls, layers, and saving
- Offline artwork flow for users who prefer paper or other physical materials
- Private artwork upload and gallery
- Crisis resources and approximate location-based support-resource guidance
- Multilingual interface support for English, Simplified Chinese, Traditional Chinese, and Spanish
- About page explaining the project story, AI use, safety boundaries, privacy, and limitations

## System Architecture

Creative Companion uses a Vercel + Supabase architecture.

- **Next.js** powers the web application, routes, server-side actions, and API endpoints.
- **Vercel** hosts the production deployment.
- **Supabase Auth** manages user authentication.
- **Supabase PostgreSQL** stores profiles, consent settings, diary entries, emotion summaries, recommendations, curated sources, RAG traces, and artwork metadata.
- **Supabase Storage** stores uploaded artwork images.
- **Supabase pgvector** supports embedding-based retrieval for curated resource chunks.
- **OpenAI API** supports AI-assisted diary reflection, recommendation generation, and resource embeddings.

## Safety and Ethical Boundaries

Creative Companion is intentionally framed as non-clinical support.

It does **not** provide:

- medical advice
- diagnosis
- psychotherapy
- art therapy
- crisis counseling
- emergency support
- guaranteed emotional outcomes from any activity

The project uses consent settings, crisis-resource display, high-risk expression detection, and curated-source retrieval to reduce risk. These protections are still preliminary and require continued review, testing, and improvement.

Known limitations include:

- possible inaccurate or unhelpful AI-generated recommendations
- possible over-reliance on the system by users
- limited real-time support for urgent emotional needs
- incomplete crisis-resource coverage outside the United States
- possible bias in AI recommendations or source coverage
- cybersecurity and privacy risks that require ongoing maintenance
- incomplete validation with intended users

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Fill in the required environment variables in `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
   OPENAI_API_KEY=your-openai-api-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   OPENAI_EMBEDDING_MODEL=text-embedding-3-small
   ```

4. Start the local development server:

   ```bash
   npm run dev
   ```

5. Open the local site:

   ```text
   http://localhost:3000
   ```

## Useful Commands

```bash
npm run dev
npm run lint
npm run build
npm run embed:resources
```

## DOI Preparation Checklist

Before archiving a version for DOI, the project should have:

- an updated README describing the current project rather than the original starter template
- a license file
- citation metadata, such as `CITATION.cff` or `.zenodo.json`
- no secrets committed to GitHub
- a clean production build
- a stable GitHub release tag, such as `v0.1.0-alpha`
- a short release description explaining what the archived version can and cannot do

## Citation

Citation metadata will be added before the first DOI release.

## License

License information will be added before the first DOI release.

