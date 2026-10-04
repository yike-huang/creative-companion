# Creative Companion

Creative Companion is an AI-powered website for personalized, art-inspired, non-clinical emotional support for cancer patients and survivors. The project aims to provide a supportive space for emotion expression, reflection, processing, and coping via creative activities.

This project is NOT a medical, diagnostic, crisis intervention, psychotherapy, or art therapy service. It is designed as a complementary creative coping tool that should not replace professional care.

## Intended Users

- Cancer patients and survivors
- Users who want private, low-pressure emotional reflection and personalized, creative coping activity recommendations

## Core Features

- User account creation and authentication
- Limited background profile collection, including age range, cancer type, cancer journey stage, and current country of residence, for personalized services
- Consent settings for AI analysis and data storage
- Space for emotion check-ins and diary entries
- AI-assisted analysis of diary entries to identify recent emotional patterns
- Personalized art-inspired coping activity recommendations based on diary content, emotion patterns, user background information, and curated mental health resources
- Text and audio step-by-step guidance for recommended activities
- A private artwork space where users can create digital art pieces, upload photos of physical artworks, and add reflections or notes
- Crisis resources, which appear when potentially high-risk emotional expressions are detected
- Supabase-backed data storage, multilingual support, and responsive web design

## Planned Architecture

The system uses a Vercel + Supabase architecture.

- Vercel hosts the Next.js web application and handles server-side API functions.
- Supabase Auth manages user accounts and authentication.
- Supabase PostgreSQL stores user profiles, diary entries, consent settings, emotion summaries, recommendation records, curated resources, RAG traces, and artwork metadata.
- Supabase Storage stores uploaded artwork photos.
- Supabase pgvector supports retrieval from curated mental health, psychoeducation, and art-inspired coping resources, building a basic RAG structure.
- OpenAI API connects the application to AI models for emotion pattern analysis, recommendation generation, and resource embeddings.
- The safety layer combines conservative risk-pattern checks with AI-assisted review, while treating crisis detection as a safety signal rather than a clinical judgment.

## Safety and Ethics

As an emotional support app for cancer patients and survivors, Creative Companion prioritizes users' safety.

- The website avoids clinical diagnosis, treatment claims, or claims of providing therapy.
- The website does NOT provide art therapy.
- All AI functions and data storage are explained and managed by user consent.
- AI outputs use supportive, reflective language and do not present themselves as a therapist, clinician, or crisis counselor.
- AI outputs are based on curated mental health resources to reduce hallucination risk.
- Crisis detection is treated as a safety signal, not a diagnosis.
- When high-risk language is detected, the app displays crisis resources clearly and immediately.
- Sensitive information collection is minimized and collected only when necessary for personalization.
- Currently, multilingual crisis support resources are still under development.
- Currently, the potential risks of user's overreliance, inability to give immediate responses to acute emotions, AI hallucination, and data insecurity under cyberattack are not fully addressed.

## Local Development

The Next.js application is located in the `web` directory.

1. Go into the app directory:

   ```bash
   cd web
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

4. Fill in the required environment variables in `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
   OPENAI_API_KEY=your-openai-api-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   OPENAI_EMBEDDING_MODEL=text-embedding-3-small
   ```

5. Start the local development server:

   ```bash
   npm run dev
   ```

6. Open the local site:

   ```text
   http://localhost:3000
   ```

## Useful Commands

Run these commands from the `web` directory:

```bash
npm run dev
npm run lint
npm run build
npm run embed:resources
```

## DOI Preparation

This repository is being prepared for a versioned DOI release. Before DOI publication, the project should have a stable GitHub release, clear citation metadata, no committed secrets, and a passing production build.

## License

This project is licensed under the MIT License.
