**Product Requirements Document (PRD) – Embeddable Video Player App (MVP)**

---

### 1. Overview

This product is an embeddable video player tailored for video creators such as indie filmmakers and animation artists. It enables creators to upload videos and share them through a simple iframe embed. Videos can be either freely viewable or protected by an on-chain paywall. The platform uses web3 infrastructure under the hood (Privy, Livepeer, Storj, Lit Protocol, and USDC on Base), but the user experience is designed to be as simple and web2-like as possible.

### 2. Goals

- Allow creators to upload and share videos via an embeddable player.
- Enable creators to monetize protected videos through one-time payments.
- Ensure viewer access is persistent based on on-chain conditions.
- Keep the user experience intuitive, hiding all unnecessary crypto complexity.

### 3. User Types

**3.1 Creator**

- Signs up via Privy (wallet auto-generated).
- Uploads and categorizes videos as Public or Protected.
- Sets price and access conditions for Protected videos.
- Receives USDC payments via gasless transactions.

**3.2 Viewer**

- Views embedded player on third-party websites.
- Signs up via Privy (wallet auto-generated).
- Pays to unlock Protected videos using USDC.
- Gains persistent access to paid content.

### 4. Features

**4.1 Creator Flow**

- Sign up / Login

  - Uses Privy for auth and wallet creation.

- Upload Video

  - Videos are transcoded using Livepeer.
  - Resulting streams are stored on Storj.

- Set Video Access Type

  - **Public**: No signup or payment required.
  - **Protected**:

    - Set conditions: USDC payment, NFT ownership, or other Lit-based access controls.
    - Set pricing in USDC.
    - Optional: Upload free preview/trailer (freely viewable).

- Get Embed Link

  - Returns an iframe embed URL with unique video ID.

**4.2 Viewer Flow**

- Encounters embedded video player.
- If Public:

  - Views video immediately without signup.

- If Protected:

  - Viewer cannot sign up directly within iframe on third-party websites due to browser restrictions.
  - Viewer is redirected (via popup or new tab) to the app's domain to complete signup/login using Privy.
  - After authentication, credentials or session data are sent back to the embedded player via postMessage or equivalent secure channel.
  - To unlock videos, wallet-related logic (e.g., payment, access verification) also happens on the app page.
  - Once completed, the user returns to the original page and the embedded player grants access.
  - Viewer gains access to full video.
  - Access is retained permanently as long as access condition remains satisfied.

### 5. Technical Architecture

- **Auth & Wallets**: Privy (auto-generates wallet upon signup).
- **Transcoding**: Livepeer (efficient, decentralized video transcoding).
- **Storage**: Storj (decentralized object storage).
- **Access Control**: Lit Protocol (handles on-chain/off-chain condition checking).
- **Payments**: USDC on Base, via gasless transactions.

### 6. UX Requirements

- Onboarding should feel like any other web2 signup.
- Use of wallets should be invisible to end-users.
- Payment flow should be simple: connect, pay, watch.
- Embeddable player should work smoothly in iframes.
- Minimalist, distraction-free player UI.
- Optional free trailer should play without signup.
- Viewer auth and unlock flow must gracefully handle third-party embed restrictions:

  - Use pop-ups or new windows for auth and payment.
  - Communicate securely between app and iframe.

### 7. Out of Scope (MVP)

- Analytics or usage metrics for creators.
- Player customization (appearance/branding).
- Content moderation or takedown workflows.
- Refunds or dispute resolution.

### 8. Future Considerations

- Add analytics dashboards for creators.
- Enable player appearance customization.
- Introduce support for subscriptions or timed rentals.
- Implement refund/dispute mechanisms.
- Add moderation and reporting features.
