# SusStyle AI Medical Helper — PRD

## Original Problem Statement
> Create AI agent for my web site. I would like to be medical helper like your private doctor. Helps with every possible medical advice. I would like to have fully working web app. Would be great to have google account registration or some time of registration by email type. Users account. Admin account where I could search history change general settings see profiles accounts. My domain is susstyle.com. I am open for suggestions.
>
> User additions: "Multi-language and voice chat sounds perfect please make sure analysis and advice are supported with original and legal sources." "Use all models available. Register with email and password. Medical features all above plus everything you could think of. Admin dashboard try your best."

## Architecture
- **Backend**: FastAPI + MongoDB (Motor) + bcrypt + PyJWT + emergentintegrations
- **Frontend**: React 19 + react-router-dom 7 + Tailwind + Shadcn UI + Recharts + Sonner + Lucide
- **AI**: Multi-LLM via Emergent Universal Key (GPT-5.2, GPT-4o, Claude Sonnet 4.5, Claude Haiku 4.5, Gemini 2.5 Pro, Gemini 2.5 Flash) + OpenAI Whisper STT + OpenAI TTS
- **Domain**: susstyle.com

## User Personas
1. **Patient** — anyone seeking quick, sourced, multi-language medical guidance
2. **Admin (site owner)** — moderates users, reviews chat history, configures models/disclaimer

## Core Requirements (static)
- Email/password JWT auth, admin role
- AI medical chat with model selection, source citations (WHO/CDC/NIH/FDA/PubMed/etc.)
- Multi-language responses (15 supported)
- Voice input (Whisper) and voice output (TTS)
- Health profile (age, sex, allergies, conditions, meds, family history, lifestyle)
- Saved conversation history per user
- Admin dashboard (users, conversations, settings, analytics)

## What's been implemented (2026-05-08)
### Backend
- `/api/auth` register, login, logout, me, refresh (httpOnly cookies + Bearer fallback, brute-force lockout — fixed tz-aware bug, Motor configured `tz_aware=True`)
- `/api/profile/health` GET/PUT
- `/api/chat/models`, `/api/chat/conversations` (list, create, get, delete), `/api/chat/send` (multi-LLM, robust citation extraction supporting markdown links + bullet styles + bold `**Sources:**` headers, profile-aware system prompt, language-aware)
- `/api/voice/transcribe` (Whisper-1), `/api/voice/tts` (tts-1, voice=sage)
- `/api/admin/users` (regex-escaped search, role, ban, delete), `/api/admin/conversations` (search, view), `/api/admin/settings`, `/api/admin/analytics`
- Admin auto-seeded; MongoDB indexes

### Frontend
- Landing (hero + features + how-it-works + CTA)
- Login, Register
- Chat (sidebar conv list, model + language selector, voice record, TTS playback, citations rendering, optimistic UI, auto-scroll)
- Profile (health profile form)
- History
- Admin dashboard (4 tabs: Overview/Users/Conversations/Settings, charts, role/ban/delete actions)
- AuthContext, I18nContext (English + Spanish UI; Spanish = sample 2nd lang), Navbar with language switcher, ProtectedRoute, MedicalDisclaimer
- Sage-green earthy design with Outfit + Manrope fonts

## Backlog / Next steps (P0/P1/P2)
- **P0**: Top up Emergent LLM key budget (current key reaches budget cap quickly with GPT-5.2)
- **P1**: Add password reset flow (forgot password email)
- **P1**: Add "export consultation as PDF" for users
- **P1**: Stream responses (SSE) for better perceived latency
- **P2**: Push to user's GitHub (use platform GitHub integration)
- **P2**: Optional Google OAuth login (Emergent-managed)
- **P2**: Symptom triage wizard (guided form → structured prompt)
- **P2**: Appointment booking integration (telehealth providers)
- **P2**: Medication reminders + drug interaction checker as a dedicated tool
- **P2**: Add more UI translations beyond English/Spanish (FR/DE/IT/PT/AR/ZH/RU…)

## Test credentials
See `/app/memory/test_credentials.md`.
