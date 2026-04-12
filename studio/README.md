# Bomaye Gym — Sanity Studio

This directory contains the Sanity v3 Studio for Bomaye Gym Munich.

---

## One-time Project Setup

### 1. Create a Sanity project

Go to [sanity.io/manage](https://sanity.io/manage) → **New project**

- **Project name:** Bomaye Gym Munich
- **Dataset:** `production`
- Note the **Project ID** shown after creation.

### 2. Set the project ID

Update both files with your real project ID:

**`sanity.cli.ts`**
```ts
api: {
  projectId: 'your-real-project-id',   // ← replace REPLACE_WITH_PROJECT_ID
  dataset: 'production',
}
```

**`sanity.config.ts`**
```ts
projectId: 'your-real-project-id',   // ← replace REPLACE_WITH_PROJECT_ID
dataset: 'production',
```

### 3. Add the frontend origin to CORS

In [sanity.io/manage](https://sanity.io/manage) → your project → **API → CORS origins**:

- Add your Vercel preview URL (e.g. `https://bomaye-gym-v2.vercel.app`)
- Add `http://localhost:3000` for local dev

---

## Local Development

```bash
cd studio
npm install          # already done
npx sanity login     # opens browser — authenticate once
npm run dev          # starts Studio at http://localhost:3333
```

---

## Deploy Studio to sanity.io/studio

```bash
cd studio
npx sanity login     # only needed once per machine
npm run deploy       # prompts for a studio hostname, e.g. "bomaye-gym"
                     # Studio will be live at https://bomaye-gym.sanity.studio
```

---

## Schema Overview

| Document (singleton) | File | Purpose |
|---|---|---|
| `siteSettings` | `schemas/documents/siteSettings.ts` | Contact, address, hours, early-bird counter |
| `homepage` | `schemas/documents/homepage.ts` | All homepage section copy and toggles |
| `pricing` | `schemas/documents/pricing.ts` | Full membership + flex pass + PT pricing |
| `familyBenefit` | `schemas/documents/familyBenefit.ts` | Family benefit module — teaser, modal, form |
| `corporateBoxing` | `schemas/documents/corporateBoxing.ts` | Corporate boxing module — teaser, modal, form |

| Object type | File | Used in |
|---|---|---|
| `ctaLink` | `schemas/objects/ctaLink.ts` | `homepage` sections |
| `formField` | `schemas/objects/formField.ts` | `familyBenefit`, `corporateBoxing` |
| `weeklyPrices` | `schemas/objects/weeklyPrices.ts` | (utility — available for future use) |
| `weeklyPricesWithCompare` | `schemas/objects/weeklyPrices.ts` | (utility — available for future use) |

All five documents are **singletons**: the Studio sidebar links directly to the single editable instance of each — no list views, no accidental duplicates.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start local dev server at `localhost:3333` |
| `npm run build` | Build static Studio bundle (verifies TypeScript + schemas) |
| `npm run deploy` | Deploy Studio to `*.sanity.studio` |
| `npm run deploy-graphql` | Deploy GraphQL API for the dataset |
