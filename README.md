# Create and Heal

Create and Heal is an AI-powered web application concept for personalized, art-inspired, non-clinical emotional support for cancer patients and survivors. The project aims to help users reflect on daily emotions, notice recent emotional patterns, and receive gentle creative coping activity suggestions grounded in curated, reliable resources.

This project is not a medical, diagnostic, crisis intervention, psychotherapy, or art therapy service. It is designed as a supportive reflection and creative coping tool that should complement, not replace, professional care.

## Intended Users

- Cancer patients
- Cancer survivors
- People navigating different stages of a cancer journey
- Users who want private, low-pressure emotional reflection and creative coping prompts

## Core Features

- User account creation and authentication
- Limited background profile collection, such as age range, cancer type, cancer journey stage, and current country of residence
- Consent settings for AI analysis, data storage, and optional emergency contact information
- Daily emotion check-ins and diary entries
- AI-assisted analysis of diary entries to identify recent emotional patterns
- Personalized art-inspired coping activity recommendations based on diary content, emotion patterns, user background information, and curated professional resources rather than model output alone
- Text and audio step-by-step guidance for recommended activities
- A private artwork space where users can upload photos of artworks and add reflections or notes
- Crisis resource display when potentially high-risk emotional expressions are detected
- Optional, user-initiated emergency contact notification
- Secure data storage, multilingual support, and responsive web design

## Planned Architecture

The system will use a Vercel + Supabase architecture.

- Vercel will host the Next.js web application and handle server-side API functions.
- Supabase Auth will manage user accounts and authentication.
- Supabase PostgreSQL will store user profiles, diary entries, consent settings, emotion summaries, recommendation records, and safety-related user preferences.
- Supabase Storage will store uploaded artwork photos.
- Supabase pgvector may support retrieval from curated mental health, psychoeducation, and art-inspired coping resources.
- Vercel AI SDK or AI Gateway may connect the application to AI models for emotion pattern analysis and recommendation generation.
- Server-side API routes will keep AI provider keys private and separate from browser code.
- The safety layer will combine conservative risk-pattern checks with AI-assisted review, while treating crisis detection as a safety signal rather than a clinical judgment.

## Safety and Ethics

Because the project supports people affected by cancer, safety boundaries must be explicit.

- The app should avoid clinical diagnosis, treatment claims, or claims of providing therapy.
- The app should use language such as "art-inspired coping activities" unless licensed clinical art therapy services and appropriate governance are involved.
- AI outputs should use supportive, reflective language and should not present itself as a therapist, clinician, or crisis counselor.
- Crisis detection should be treated as a safety signal, not a diagnosis.
- When high-risk language is detected, the app should display crisis resources clearly and immediately.
- Emergency contact notification should remain user-controlled, opt-in, transparent, and manually confirmed by the user.
- Users should be able to understand what data is stored, what is analyzed by AI, and what can be deleted.
- Sensitive fields should be minimized and collected only when necessary for personalization or safety, with a clear reason for each field.
- Multilingual support should include region-aware crisis and support resources when possible.

## Data Model Ideas

Potential Supabase tables:

- `profiles`: user background and non-sensitive personalization fields
- `consents`: user choices for AI analysis, data storage, and optional emergency contact use
- `diary_entries`: daily check-ins and diary text
- `emotion_summaries`: AI-generated pattern summaries, with timestamps and model metadata
- `recommendations`: recommended activities and the reasoning or source references used
- `artworks`: uploaded artwork metadata and user reflections
- `curated_resources`: reviewed resources used for retrieval and recommendation grounding

## Development Direction

The first build should focus on a small, safe MVP:

1. Authentication and user profile
2. Consent settings
3. Daily check-in and diary CRUD
4. Basic non-clinical emotion summary with careful storage of sensitive analysis results
5. Curated art-inspired activity recommendations
6. Crisis resource display for high-risk expressions
7. Artwork upload and private reflections

The project should grow slowly, with privacy, consent, and safety reviewed at each stage.
