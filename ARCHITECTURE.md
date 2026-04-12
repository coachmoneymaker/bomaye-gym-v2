# Bomaye Gym Munich — Architecture & Schema Plan

> **Status:** Pre-implementation planning document
> **Last updated:** 2026-03-16
> **Purpose:** Single source of truth for content structure, data schemas, and module design before any Phase 1 implementation begins.

---

## 1. Project Overview

Bomaye Gym Munich is a static marketing website (HTML/CSS/Vanilla JS) deployed on Vercel.
There is no backend server or database. All editable content lives in JavaScript configuration files under `assets/js/` and a JSON data file under `data/`.

### Content Management Approach

Content is managed by editing plain JavaScript/JSON files — no developer tooling, CMS dashboard, or build step required for content updates. The pattern already established:

| File | Role |
|---|---|
| `assets/js/config.js` | Global site config: contact, address, hours, pricing, early bird |
| `assets/js/faq-data.js` | FAQ content by category |
| `data/earlybird.json` | Live early-bird spot count (server-editable without code deploy) |

The architecture described in this document extends this same pattern with four additional modules.

---

## 2. Current Module Inventory

### 2.1 `BOMAYE` — Global Config Object (`config.js`)

```
BOMAYE
├── openingStatus        string
├── earlyBird
│   ├── total            number
│   └── remaining        number
├── contact
│   ├── phoneDisplay     string
│   ├── phoneHref        string
│   ├── whatsappHref     string
│   ├── email            string
│   ├── instagram        string
│   ├── youtube          string
│   └── tiktok           string
├── address
│   ├── street           string
│   ├── area             string
│   ├── city             string
│   ├── transport        string
│   ├── mapLat           number
│   └── mapLon           number
├── hours
│   ├── weekdays         string
│   ├── saturday         string
│   └── sunday           string
└── pricing
    ├── enrollmentFee    number
    ├── programs[]       Program (see §2.1.1)
    ├── personal         SpecialProgram
    └── corporate        SpecialProgram
```

#### 2.1.1 Program shape (current)

```
Program {
  id              string   (slug)
  name            string
  tag             string   (badge label)
  icon            string   (Font Awesome class)
  ageGroups       string[]
  earlyBirdPrices { '1M', '3M', '6M', '12M' }  → number (weekly €)
  regularPrices   { '1M', '3M', '6M', '12M' }  → number (weekly €)
  note?           string
}
```

### 2.2 `BOMAYE_FAQ` — FAQ Data (`faq-data.js`)

Array of FAQ category objects, each with `category`, `id`, and `items[]` (`q`/`a` pairs).

### 2.3 `earlybird.json`

```json
{ "spots_left": number, "total": number, "note": string }
```

---

## 3. New Modules — Schema Plan

The four modules below must be added before Phase 1 implementation.
They follow the same edit-in-place JavaScript/JSON pattern already established.
Each module is a named top-level constant so any file can import or reference it independently.

---

### 3.1 `BOMAYE_HOMEPAGE` — Homepage Singleton (`homepage-content.js`)

A single exported object that owns every editable block on the homepage.
No block is hard-coded in HTML — all copy, labels, and toggle flags come from here.

```
BOMAYE_HOMEPAGE
│
├── hero
│   ├── badge              string    e.g. "NOW OPEN · EARLY BIRD ACTIVE"
│   ├── headline           string    main H1
│   ├── subheadline        string    supporting line beneath H1
│   ├── ctaPrimary         { label, href }
│   └── ctaSecondary       { label, href }
│
├── announcement
│   ├── enabled            boolean
│   ├── text               string    top-of-page banner / sticky bar copy
│   └── linkHref?          string    optional CTA from announcement bar
│
├── earlyBird
│   ├── enabled            boolean
│   ├── sectionBadge       string    e.g. "EARLY BIRD OFFER"
│   ├── headline           string
│   ├── subtext            string
│   ├── spotsLabel         string    e.g. "Noch {n} Plätze" (use {n} as placeholder)
│   ├── spotsBarEnabled    boolean
│   └── cta                { label, href }
│
├── membershipIntro
│   ├── sectionBadge       string
│   ├── headline           string
│   ├── subtext            string
│   └── cta                { label, href }   links to pricing section / page
│
├── familyBenefitTeaser
│   ├── enabled            boolean   — mirrors familyBenefit.enabled (§3.3)
│   ├── sectionBadge       string
│   ├── headline           string
│   ├── subtext            string
│   └── cta                { label }   opens family benefit modal
│
├── personalTrainingTeaser
│   ├── sectionBadge       string
│   ├── headline           string
│   ├── subtext            string
│   ├── bulletPoints       string[]
│   └── cta                { label, href }
│
├── corporateBoxingTeaser
│   ├── enabled            boolean   — mirrors corporateBoxing.enabled (§3.4)
│   ├── sectionBadge       string
│   ├── headline           string
│   ├── subtext            string
│   └── cta                { label }   opens corporate boxing modal
│
└── faqTeaser
    ├── sectionBadge       string
    ├── headline           string
    ├── subtext            string
    ├── cta                { label, href }   links to /faq
    └── seoFooterText      string    hidden paragraph for on-page SEO (rendered below fold)
```

**Design notes:**
- `enabled` flags allow a section to be hidden without removing code.
- `{n}` placeholder in `spotsLabel` is substituted at runtime by the early-bird counter logic already in `config.js`.
- Teaser `enabled` fields should default to the value of their respective module's `enabled` flag so they stay in sync.

---

### 3.2 `BOMAYE_PRICING` — Membership & Pricing Module (`pricing.js`)

Replaces and supersedes `BOMAYE.pricing` in `config.js`.
Splits the generic `programs[]` + ad-hoc special entries into typed, purpose-built pricing structures.

```
BOMAYE_PRICING
│
├── enrollmentFee
│   ├── amount             number    one-time Aufnahmegebühr in €
│   ├── label              string    e.g. "Aufnahmegebühr"
│   ├── note               string    e.g. "einmalig bei Vertragsabschluss"
│   └── earlyBirdWaived    boolean   true = fee waived for early-bird members
│
├── memberships[]          MembershipTier
│   Each tier:
│   ├── id                 string    slug (e.g. "kids", "youth", "olympic")
│   ├── name               string    display name
│   ├── tag                string    badge (e.g. "KIDS", "VEREIN")
│   ├── icon               string    Font Awesome class
│   ├── ageGroups          string[]
│   ├── note?              string    small print under tile
│   ├── earlyBird
│   │   └── weekly         { '1M', '3M', '6M', '12M' } → number  weekly € price
│   └── regular
│       ├── weekly         { '1M', '3M', '6M', '12M' } → number  weekly € price
│       ├── compareWeekly? { '1M', '3M', '6M', '12M' } → number  strike-through price
│       └── savingsText?   { '1M', '3M', '6M', '12M' } → string  e.g. "Du sparst 8€/Woche"
│
├── flexPasses
│   ├── dayPass
│   │   ├── enabled        boolean
│   │   ├── label          string    e.g. "Tageskarte"
│   │   ├── price          number    €
│   │   └── note?          string
│   ├── tenCard
│   │   ├── enabled        boolean
│   │   ├── label          string    e.g. "10er-Karte"
│   │   ├── price          number    €
│   │   ├── pricePerVisit  number    € (calculated display value)
│   │   └── note?          string
│   └── twentyCard
│       ├── enabled        boolean
│       ├── label          string    e.g. "20er-Karte"
│       ├── price          number    €
│       ├── pricePerVisit  number    € (calculated display value)
│       └── note?          string
│
├── personalTraining
│   ├── label              string    section display name
│   ├── icon               string    Font Awesome class
│   ├── forMembers
│   │   ├── pricePerSession     number   €
│   │   ├── comparePrice?       number   € strike-through
│   │   ├── savingsText?        string
│   │   ├── tenCardPrice        number   € total for 10-card
│   │   ├── tenCardPricePerUnit number   € per session
│   │   └── note?               string
│   └── forNonMembers
│       ├── pricePerSession     number   €
│       ├── comparePrice?       number   € strike-through
│       ├── tenCardPrice        number   € total for 10-card
│       ├── tenCardPricePerUnit number   € per session
│       └── note?               string
│
└── corporate
    ├── label              string    e.g. "Corporate Boxing"
    ├── icon               string    Font Awesome class
    ├── priceLabel         string    e.g. "Auf Anfrage"
    └── note               string    e.g. "Pakete für Teams ab 5 Personen"
```

**Design notes:**
- `compareWeekly` holds the crossed-out "was" price; `savingsText` holds a human-readable savings string. Both are optional — omit to hide the compare/savings UI.
- `flexPasses` replaces the FAQ placeholder answer about 10/20-cards being unavailable. Set `enabled: false` until officially launched.
- The legacy `BOMAYE.pricing` object in `config.js` should be deprecated (kept as read-only fallback during migration, then removed).

---

### 3.3 `BOMAYE_FAMILY` — Family Benefit Module (`family-benefit.js`)

A self-contained module for the family discount / family inquiry feature.
It drives both the homepage teaser (via §3.1 `familyBenefitTeaser`) and the full modal/form.

```
BOMAYE_FAMILY
│
├── enabled                boolean   master switch — false hides teaser + modal entirely
│
├── teaser
│   ├── label              string    badge/chip label, e.g. "FAMILIEN-VORTEIL"
│   └── text               string    1–2 sentence hook shown on homepage tile
│
├── modal
│   ├── title              string    modal heading
│   ├── supportText        string    paragraph beneath heading
│   ├── bulletPoints       string[]  benefit list items shown inside modal
│   └── formTitle          string    heading above the form fields
│
├── form
│   ├── fields[]           FormField
│   │   Each field:
│   │   ├── id             string    unique key (used as input name/id)
│   │   ├── label          string    visible label
│   │   ├── type           string    "text" | "email" | "tel" | "select" | "textarea" | "checkbox"
│   │   ├── placeholder?   string
│   │   ├── options?       string[]  for type "select"
│   │   ├── required       boolean
│   │   └── order          number    render order (ascending)
│   ├── submitLabel        string    button text, e.g. "Anfrage senden"
│   └── recipientEmail     string    destination address for form submissions
│
└── successMessage
    ├── title              string    e.g. "Anfrage gesendet!"
    └── text               string    confirmation copy shown after submit
```

**Design notes:**
- `enabled: false` removes the teaser from the homepage and disables the modal trigger entirely — no form submissions possible.
- `fields[]` are rendered in `order` sequence. Adding or removing a field here automatically updates the modal form without HTML changes.
- `recipientEmail` is the only place the destination address is defined; it must be read by the form-submission handler at runtime or at build time (e.g. injected into a Formspree/Netlify Forms endpoint configuration).

---

### 3.4 `BOMAYE_CORPORATE` — Corporate Boxing Module (`corporate-boxing.js`)

A self-contained module for the corporate boxing product.
It drives both the homepage teaser (via §3.1 `corporateBoxingTeaser`) and the full modal/form.

```
BOMAYE_CORPORATE
│
├── enabled                boolean   master switch — false hides teaser + modal entirely
│
├── teaser
│   ├── title              string    headline on homepage tile
│   └── text               string    1–2 sentence hook
│
├── modal
│   ├── title              string    modal heading
│   ├── supportText        string    paragraph beneath heading
│   ├── benefits[]         string    list of corporate program selling points
│   ├── cateringOption
│   │   ├── enabled        boolean   shows/hides catering add-on copy in modal
│   │   ├── label          string    e.g. "Catering & Getränke buchbar"
│   │   └── description    string    brief catering details
│   └── formTitle          string    heading above the form fields
│
├── form
│   ├── fields[]           FormField  (same shape as §3.3 BOMAYE_FAMILY.form.fields[])
│   │   ├── id             string
│   │   ├── label          string
│   │   ├── type           string    "text" | "email" | "tel" | "select" | "textarea" | "checkbox"
│   │   ├── placeholder?   string
│   │   ├── options?       string[]  for type "select"
│   │   ├── required       boolean
│   │   └── order          number
│   ├── submitLabel        string    e.g. "Paket anfragen"
│   └── recipientEmail     string    destination address for form submissions
│
└── successMessage
    ├── title              string    e.g. "Anfrage erhalten!"
    └── text               string    confirmation copy
```

**Design notes:**
- `cateringOption.enabled` lets the gym toggle the catering upsell copy without removing the field from the schema.
- `benefits[]` is a plain string array rendered as a bullet list inside the modal — easy to edit without HTML knowledge.
- `recipientEmail` should differ from the family benefit email if corporate inquiries go to a different person/inbox.

---

## 4. File Map — Target State

```
assets/
└── js/
    ├── config.js              existing — keep (deprecate BOMAYE.pricing sub-tree)
    ├── faq-data.js            existing — unchanged
    ├── homepage-content.js    NEW — BOMAYE_HOMEPAGE singleton (§3.1)
    ├── pricing.js             NEW — BOMAYE_PRICING (§3.2)
    ├── family-benefit.js      NEW — BOMAYE_FAMILY (§3.3)
    └── corporate-boxing.js    NEW — BOMAYE_CORPORATE (§3.4)

data/
└── earlybird.json             existing — unchanged
```

All four new files follow the same `const NAME = { ... };` pattern as `config.js` and `faq-data.js`.
No module bundler, no imports/exports — files are loaded as plain `<script src="...">` tags in dependency order.

---

## 5. Script Load Order (HTML)

When the new modules are implemented, the `<script>` loading order in every HTML page must be:

```html
<!-- 1. Core config (contact, address, hours, early bird) -->
<script src="/assets/js/config.js"></script>

<!-- 2. New content modules (no inter-dependencies among these four) -->
<script src="/assets/js/pricing.js"></script>
<script src="/assets/js/family-benefit.js"></script>
<script src="/assets/js/corporate-boxing.js"></script>
<script src="/assets/js/homepage-content.js"></script>

<!-- 3. FAQ data -->
<script src="/assets/js/faq-data.js"></script>

<!-- 4. Main application logic (reads all of the above) -->
<script src="/assets/js/main.js"></script>
```

`homepage-content.js` is loaded last among the content modules because its `familyBenefitTeaser.enabled` and `corporateBoxingTeaser.enabled` fields may reference the master `enabled` values from the family and corporate modules.

---

## 6. Migration Notes

| Item | Action |
|---|---|
| `BOMAYE.pricing.programs[]` | Superseded by `BOMAYE_PRICING.memberships[]`. Keep in `config.js` as read-only fallback during migration; remove after Phase 1 QA. |
| `BOMAYE.pricing.personal` | Superseded by `BOMAYE_PRICING.personalTraining`. Same migration plan. |
| `BOMAYE.pricing.corporate` | Superseded by `BOMAYE_PRICING.corporate`. Same migration plan. |
| FAQ answer re: Tageskarten | FAQ copy should be updated once `BOMAYE_PRICING.flexPasses` values are confirmed. |

---

## 7. Out of Scope (Phase 1)

The following are noted here to prevent scope creep during Phase 1 implementation:

- No backend or API — all content remains in static JS/JSON files.
- No CMS dashboard or admin UI.
- No authentication.
- No server-side form processing — form submissions use a third-party handler (Formspree, Netlify Forms, or similar); `recipientEmail` is passed as a config value to that handler.
- No automated early-bird spot decrement — `earlybird.json` is updated manually or via a separate deployment step.
