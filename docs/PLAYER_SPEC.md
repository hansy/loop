**Spec: Smart Embedded Video Player with Unlockable Content**

---

## 🔍 Overview

A lightweight, iframe-embeddable video player that supports both public and protected (gated) videos. If a video is protected, the player must check if the user has access and present unlock options if not. Authentication and unlock logic are offloaded to popup/redirect flows on the main site, and access is enforced via the presence or absence of a `signedUrl`.

---

## ⚙️ Architecture Summary

- **Embedded via iframe** into third-party sites.
- **Fetches metadata** for the video on load.
- Uses **signed URLs** to determine access.
- Unlock/purchase/authenticate flows are handled **externally** (popup/redirect to main site).
- Communicates with external window via `window.open` or `postMessage`.

---

## 🌐 API Endpoints

### `GET /api/videos/:id/metadata`

Returns metadata:

```ts
{
  id: string;
  title: string;
  isPublic: boolean;
  previewUrl?: string;
  thumbnailUrl?: string;
  unlockOptions: UnlockOption[];
}
```

### `GET /api/videos/:id/signed-url`

Returns access status:

```ts
{
  signedUrl: string | null;
  access: boolean;
  reason?: "not_logged_in" | "not_unlocked" | "error";
}
```

### `POST /api/videos/:id/unlock`

(External flow handles this)

---

## 🔄 Player States & UI

### 1. `LOADING_METADATA`

- Spinner or skeleton loader
- Disables all controls

### 2. `PUBLIC_ACCESS`

- Metadata indicates `isPublic: true`
- Loads and plays video using public URL
- Standard controls
- Optional badge: "Public"

### 3. `PROTECTED_ACCESS`

#### A. `USER_NOT_AUTHENTICATED`

- Show lock screen overlay:

  > "This video is protected."
  > \[Check if you have access]

- Button opens login/auth popup
- Preview video can be shown if available

#### B. `USER_AUTHENTICATED_BUT_NO_ACCESS`

- Show lock screen with unlock options:

  - Price and currency
  - NFT requirements
  - Unlock button(s)

- UI includes indicator that user is logged in (e.g. avatar/email in top-right)

#### C. `USER_HAS_ACCESS`

- Signed URL present
- Load and autoplay video
- Optional badge: "Unlocked"

---

## 📹 UI Placement & Behavior

- **All UI stays inside the iframe bounds.**
- Auth and unlock flows happen in popup or redirect.
- Player listens for `postMessage` or reloads on return.
- Top-right corner can show auth indicator (e.g., user email, avatar, wallet address)

---

## ❌ Error/Edge States

| State                | UI Reaction                                  |
| -------------------- | -------------------------------------------- |
| Access check failed  | Show soft error toast with retry             |
| Unlock failed        | Show message + retry option                  |
| Signed URL expired   | Show reload prompt or auto-refresh           |
| Wallet not connected | Show connect wallet button                   |
| User not logged in   | Show login CTA before showing unlock options |

---

## 🧰 Enhancements

- Blur preview video for locked content
- Fade-in "Unlock to continue" overlay after preview ends
- Cache `hasAccess` status for short period in session/local storage
- Accept `?forceState=locked` param for dev/testing

---

## 🌪️ Summary Flow

1. Load metadata
2. If public: play video
3. If protected:

   - Check for signed URL
   - If present: play
   - If absent:

     - If not logged in: show login CTA
     - If logged in: show unlock options

4. After popup completes unlock/auth:

   - Recheck access (via reload or `postMessage`)
   - Load `signedUrl` if access granted
