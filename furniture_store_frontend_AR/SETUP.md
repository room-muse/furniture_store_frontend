# RoomMuse AR — Integration for furniture_store_frontend

This adds QR-code AR functionality to the existing furniture store website
**without changing any original files**.

## What's in this package

```
furniture_store_frontend/
├── index.html                ← ORIGINAL (untouched)
├── main.js                   ← ORIGINAL (untouched)
├── main.css                  ← ORIGINAL (untouched)
├── product.css               ← ORIGINAL (untouched)
├── catalog.csv               ← ORIGINAL (untouched)
├── images/                   ← ORIGINAL (untouched)
│
├── roommuse-ar-overlay.js    ← NEW — the AR/QR overlay (1 file, self-contained)
├── index-with-ar.html        ← NEW — copy of index.html + 1 script tag added
│
└── SETUP.md                  ← You're reading this
```

## How to test (30 seconds)

```bash
cd furniture_store_frontend
python3 -m http.server 8080
```

Then open **http://localhost:8080/index-with-ar.html**

Click any **3D/AR** button on a product card → a QR code modal pops up.
Scan the QR with your phone → it opens the AR viewer.

## What the overlay does

The website already has "3D/AR" buttons on every product card and in the
product detail modal. The original `openArView()` function in main.js is
just a placeholder that shows an alert. 

`roommuse-ar-overlay.js` does the following (without touching any original files):

1. Overrides `openArView()` to open a real AR modal
2. Fixes a bug in the original code (`parseInt` on UUID strings)
3. Calls `GET /items/{uuid}` on the backend to fetch the 3D model URL
4. Generates a QR code linking to `ec-design.vercel.app?model=...`
5. On mobile: skips the QR and opens AR viewer directly
6. Watches for dynamic page changes (pagination, search) via MutationObserver
7. Self-loads the QRCode.js library from CDN (no extra script tags needed)

## How it connects to the backend

```
User clicks 3D/AR button
        ↓
Overlay calls: GET https://ar-backend-563656133641.us-central1.run.app/items/{product-uuid}
        ↓
Backend returns: { modelUrl: "https://....glb", name, dimensions, ... }
        ↓
Overlay generates QR code → points to: https://ec-design.vercel.app?model=...&name=...
        ↓
Phone scans QR → AR viewer loads → furniture appears in room
```

The product UUIDs in main.js (e.g. `02ed2874-4d57-48c1-87c7-373f562067fb`)
match the `id` column in catalog.csv, which are the same IDs used in the
backend API.

## For production deployment on roommusestudio.com

When ready to deploy for real, just add ONE line to the original index.html
right after the main.js script tag:

```html
    <script src="main.js"></script>
    <script src="roommuse-ar-overlay.js"></script>   <!-- ADD THIS LINE -->
</body>
```

That's it. One file, one line.

## Prerequisites

- **Angela** has built the mock website ✅ (this repo)
- **Aditya** needs to upload `catalog.csv` to the backend
- After step 2, the 3D models get auto-generated and the AR buttons will
  show real QR codes linking to actual models

If the backend hasn't received the CSV yet, the overlay still works — it
shows a QR code pointing to the AR viewer with a note that the 3D model
hasn't been generated yet.
