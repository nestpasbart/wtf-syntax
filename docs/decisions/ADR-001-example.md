# ADR-001: Firebase Hosting for production deploy

**Date**: 2025-01-01  
**Status**: accepted

## Context

Need a reliable, low-ops hosting solution for the FLEX app (React + Firebase).

## Decision

Use Firebase Hosting with custom domain via TransIP DNS.

## Reasoning

Firebase Hosting is already in the stack (Firestore, Auth). Preview channels are free and give real URLs for smoke testing. Zero additional infrastructure.

## Consequences

- Preview deploys available via `firebase hosting:channel:deploy`
- DNS management via TransIP — watch for trailing dot issue on CNAME records (TransIP adds it automatically; Firebase expects no trailing dot)
- Rollback is instant via Firebase console

## Alternatives considered

- **Vercel**: Good DX but adds another service. Firebase already in stack.
- **Netlify**: Same reasoning.
