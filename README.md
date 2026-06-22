# ProTrack OS v2.0 MVP

A bilingual, mobile-first, local-first PWA built around **PROTRACK AI ANALYST v2.0 FINAL MASTER CLEAN** and the ProTrack v7.1 Pro Production methodology.

## Run

1. Right-click `start.ps1` and choose **Run with PowerShell**.
2. Open [http://127.0.0.1:4173](http://127.0.0.1:4173).

The app uses protected, role-based academy accounts. A clean installation opens a six-step academy setup flow before sign-in; existing upgraded installations keep their current accounts and data.

## Initial accounts

- Head Coach: `headcoach` / `ProTrack2026!`
- Assistant Coach: `assistant` / `Coach2026!`
- Player: `player` / `Player2026!`

Change each password from **Settings → Account & security** after first sign-in.

## What works

- Player profiles, session history, video intake metadata, and manual match statistics
- Server-authenticated Head Coach, Assistant Coach, and Player access with protected sessions
- First-time academy onboarding with head coach, optional assistant, first player and logo setup
- Linked account management for Head Coach, Assistant Coach and Player profiles
- Academy profile, certifications, coach profiles and assigned-player scoping
- Registration pipeline, assessment bookings, programs and player archiving
- Complete player passport, competitions, rankings, achievements and journey timeline
- Leaderboards and player transformation stories
- Nightly academy dashboard, alerts, action center, attendance, packages, and promotion queue
- Persian RTL and English LTR with instant switching
- Installable PWA shell with offline support and bottom navigation
- iPhone standalone metadata, Apple touch icon, branded startup image and safe-area layout
- Full local JSON backup and restore
- Evidence-supported scoring with explicit `Insufficient Data` handling
- Locked PDI formula and normalized PTI formula
- Promotion thresholds, core rubric minimums, evidence confidence, and history checks
- All 17 report sections in the required order and the exact dashboard output schema
- Real PDF and DOCX export through the included local server
- Responsive premium black, blue, and silver interface
- Official ProTrack Private Coaching logo across the app and exported reports

## MVP boundary

The application does not claim autonomous computer-vision scoring. Uploaded video remains on the local device, while an analyst records observable evidence and scores. This preserves the specification's rule against guessing. A production version can connect the same evidence fields to a verified video-analysis model without changing the scoring engine.
