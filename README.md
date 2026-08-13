# CaseForge — RNGBlox-style case opening demo

A from-scratch React/Vite frontend for a randomized case-opening website.

## Run

1. Install Node.js 18+.
2. Open this folder in a terminal.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the local URL Vite prints.

## Important

This is a frontend demo. The balance and randomization are intentionally client-side for demonstration only.

For a production / real-money platform, move:
- authentication
- wallet/balance accounting
- case opening
- RNG
- inventory
- payments
- item delivery
- transaction logs

to a secure backend.

For fair random outcomes, implement a provably-fair commit/reveal scheme or another independently verifiable server-side mechanism. Also verify applicable gambling, consumer-protection, payment-provider, age, and jurisdiction requirements before launch.
