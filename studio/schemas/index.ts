// ── Object types (reusable) ──────────────────────────────────
import {ctaLink} from './objects/ctaLink'
import {formField} from './objects/formField'
import {weeklyPrices, weeklyPricesWithCompare} from './objects/weeklyPrices'

// ── Document types (singletons) ──────────────────────────────
import {siteSettings} from './documents/siteSettings'
import {homepage} from './documents/homepage'
import {pricing} from './documents/pricing'
import {familyBenefit} from './documents/familyBenefit'
import {corporateBoxing} from './documents/corporateBoxing'
import {faq} from './documents/faq'

// ── Document types (collections) ─────────────────────────────
import {coach} from './documents/coach'
import {course} from './documents/course'

/**
 * All schema types registered with Sanity Studio.
 * Object types must be declared before document types that reference them.
 */
export const schemaTypes = [
  // Objects first
  ctaLink,
  formField,
  weeklyPrices,
  weeklyPricesWithCompare,

  // Singleton documents
  siteSettings,
  homepage,
  pricing,
  familyBenefit,
  corporateBoxing,
  faq,

  // Collection documents
  coach,
  course,
]
