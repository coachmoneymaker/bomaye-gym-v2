import {defineType, defineField} from 'sanity'

/**
 * Weekly price set covering all four membership durations.
 * Used for both earlyBird and regular price tiers on MembershipTier.
 */
export const weeklyPrices = defineType({
  name: 'weeklyPrices',
  title: 'Weekly Prices',
  type: 'object',
  description: 'Price per week (€) for each contract duration',
  fields: [
    defineField({
      name: 'oneMonth',
      title: '1-Month Contract (€/week)',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'threeMonths',
      title: '3-Month Contract (€/week)',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'sixMonths',
      title: '6-Month Contract (€/week)',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'twelveMonths',
      title: '12-Month Contract (€/week)',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    }),
  ],
})

/**
 * Extended weekly price set with optional compare (strike-through) prices
 * and savings text — used on the regular pricing tier of MembershipTier.
 */
export const weeklyPricesWithCompare = defineType({
  name: 'weeklyPricesWithCompare',
  title: 'Weekly Prices (with Compare)',
  type: 'object',
  fields: [
    defineField({
      name: 'oneMonth',
      title: '1-Month Contract (€/week)',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'threeMonths',
      title: '3-Month Contract (€/week)',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'sixMonths',
      title: '6-Month Contract (€/week)',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'twelveMonths',
      title: '12-Month Contract (€/week)',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    }),

    // ── Compare (strike-through) prices ─────────────────────────
    defineField({
      name: 'compareOneMonth',
      title: 'Strike-Through Price — 1 Month (€/week)',
      type: 'number',
      description: 'Leave empty to hide strike-through',
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: 'compareThreeMonths',
      title: 'Strike-Through Price — 3 Months (€/week)',
      type: 'number',
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: 'compareSixMonths',
      title: 'Strike-Through Price — 6 Months (€/week)',
      type: 'number',
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: 'compareTwelveMonths',
      title: 'Strike-Through Price — 12 Months (€/week)',
      type: 'number',
      validation: (Rule) => Rule.positive(),
    }),

    // ── Savings text ─────────────────────────────────────────────
    defineField({
      name: 'savingsOneMonth',
      title: 'Savings Text — 1 Month',
      type: 'string',
      description: 'e.g. "Du sparst 4€/Woche" — leave empty to hide',
    }),
    defineField({
      name: 'savingsThreeMonths',
      title: 'Savings Text — 3 Months',
      type: 'string',
    }),
    defineField({
      name: 'savingsSixMonths',
      title: 'Savings Text — 6 Months',
      type: 'string',
    }),
    defineField({
      name: 'savingsTwelveMonths',
      title: 'Savings Text — 12 Months',
      type: 'string',
    }),
  ],
})
