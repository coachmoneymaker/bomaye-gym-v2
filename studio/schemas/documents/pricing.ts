import {defineType, defineField, defineArrayMember} from 'sanity'

/**
 * pricing — singleton
 * Full Bomaye pricing model. Supersedes BOMAYE.pricing in config.js.
 *
 * Covers:
 * - Enrollment fee
 * - Membership tiers (Kids → Mind & Body) with Early Bird + Regular weekly prices,
 *   optional strike-through compare prices, and savings text per duration
 * - Flex passes: Day pass, 10-card, 20-card
 * - Personal training: per-session + 10-card for members and non-members
 * - Corporate: label + note (full detail lives in corporateBoxing module)
 */
export const pricing = defineType({
  name: 'pricing',
  title: 'Pricing',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  groups: [
    {name: 'enrollment', title: 'Enrollment Fee'},
    {name: 'memberships', title: 'Membership Tiers'},
    {name: 'flex', title: 'Flex Passes'},
    {name: 'pt', title: 'Personal Training'},
    {name: 'corporate', title: 'Corporate'},
  ],
  fields: [
    // ── Enrollment Fee ───────────────────────────────────────────
    defineField({
      name: 'enrollmentFee',
      title: 'Enrollment Fee',
      type: 'object',
      group: 'enrollment',
      fields: [
        defineField({
          name: 'amount',
          title: 'Amount (€)',
          type: 'number',
          description: 'One-time fee charged at signup (Aufnahmegebühr)',
          validation: (Rule) => Rule.required().positive(),
        }),
        defineField({
          name: 'label',
          title: 'Label',
          type: 'string',
          description: 'e.g. "Aufnahmegebühr"',
          initialValue: 'Aufnahmegebühr',
        }),
        defineField({
          name: 'note',
          title: 'Note',
          type: 'string',
          description: 'e.g. "einmalig bei Vertragsabschluss"',
        }),
        defineField({
          name: 'earlyBirdWaived',
          title: 'Waived for Early-Bird Members',
          type: 'boolean',
          description: 'If true, early-bird members do not pay the enrollment fee',
          initialValue: false,
        }),
      ],
    }),

    // ── Membership Tiers ─────────────────────────────────────────
    defineField({
      name: 'memberships',
      title: 'Membership Tiers',
      type: 'array',
      group: 'memberships',
      description:
        'One entry per membership program (Kids, Youth, Olympic, Kickboxing, Women\'s, Mind & Body, …). Order determines display order.',
      of: [
        defineArrayMember({
          name: 'membershipTier',
          title: 'Membership Tier',
          type: 'object',
          fields: [
            defineField({
              name: 'id',
              title: 'ID (slug)',
              type: 'slug',
              description: 'Unique identifier, e.g. "kids", "olympic". Used by the frontend.',
              options: {source: 'name'},
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'name',
              title: 'Name',
              type: 'string',
              description: 'Display name, e.g. "Kids Boxing"',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'tag',
              title: 'Badge Label',
              type: 'string',
              description: 'Short badge shown on the pricing card, e.g. "KIDS"',
            }),
            defineField({
              name: 'icon',
              title: 'Icon (Font Awesome class)',
              type: 'string',
              description: 'e.g. "fa-child", "fa-trophy"',
            }),
            defineField({
              name: 'ageGroups',
              title: 'Age Groups',
              type: 'array',
              of: [{type: 'string'}],
              options: {
                list: [
                  {title: 'Kids (6–9)', value: 'kids'},
                  {title: 'Jugend / Youth (10–17)', value: 'jugend'},
                  {title: 'Erwachsene / Adults', value: 'erwachsene'},
                ],
              },
            }),
            defineField({
              name: 'note',
              title: 'Small Print / Note',
              type: 'string',
              description: 'Optional note shown beneath the pricing tile',
            }),

            // ── Early Bird Weekly Prices ─────────────────────────
            defineField({
              name: 'earlyBirdWeekly',
              title: 'Early Bird Weekly Prices (€/week)',
              type: 'object',
              description: 'Guaranteed price for early-bird members per contract duration',
              fields: [
                defineField({name: 'oneMonth', title: '1 Month', type: 'number', validation: (Rule) => Rule.required().positive()}),
                defineField({name: 'threeMonths', title: '3 Months', type: 'number', validation: (Rule) => Rule.required().positive()}),
                defineField({name: 'sixMonths', title: '6 Months', type: 'number', validation: (Rule) => Rule.required().positive()}),
                defineField({name: 'twelveMonths', title: '12 Months', type: 'number', validation: (Rule) => Rule.required().positive()}),
              ],
            }),

            // ── Regular Weekly Prices ────────────────────────────
            defineField({
              name: 'regularWeekly',
              title: 'Regular Weekly Prices (€/week)',
              type: 'object',
              description: 'Standard prices after early bird period ends',
              fields: [
                defineField({name: 'oneMonth', title: '1 Month', type: 'number', validation: (Rule) => Rule.required().positive()}),
                defineField({name: 'threeMonths', title: '3 Months', type: 'number', validation: (Rule) => Rule.required().positive()}),
                defineField({name: 'sixMonths', title: '6 Months', type: 'number', validation: (Rule) => Rule.required().positive()}),
                defineField({name: 'twelveMonths', title: '12 Months', type: 'number', validation: (Rule) => Rule.required().positive()}),
              ],
            }),

            // ── Compare (Strike-Through) Prices ─────────────────
            defineField({
              name: 'compareWeekly',
              title: 'Compare / Strike-Through Prices (€/week)',
              type: 'object',
              description: 'Crossed-out "was" price shown next to the regular price. Leave a field empty to hide that duration\'s compare price.',
              fields: [
                defineField({name: 'oneMonth', title: '1 Month', type: 'number', validation: (Rule) => Rule.positive()}),
                defineField({name: 'threeMonths', title: '3 Months', type: 'number', validation: (Rule) => Rule.positive()}),
                defineField({name: 'sixMonths', title: '6 Months', type: 'number', validation: (Rule) => Rule.positive()}),
                defineField({name: 'twelveMonths', title: '12 Months', type: 'number', validation: (Rule) => Rule.positive()}),
              ],
            }),

            // ── Savings Text ─────────────────────────────────────
            defineField({
              name: 'savingsText',
              title: 'Savings Text',
              type: 'object',
              description: 'Human-readable savings copy per duration, e.g. "Du sparst 8€/Woche". Leave empty to hide.',
              fields: [
                defineField({name: 'oneMonth', title: '1 Month', type: 'string'}),
                defineField({name: 'threeMonths', title: '3 Months', type: 'string'}),
                defineField({name: 'sixMonths', title: '6 Months', type: 'string'}),
                defineField({name: 'twelveMonths', title: '12 Months', type: 'string'}),
              ],
            }),
          ],
          preview: {
            select: {name: 'name', tag: 'tag'},
            prepare({name, tag}) {
              return {title: name, subtitle: tag}
            },
          },
        }),
      ],
    }),

    // ── Flex Passes ──────────────────────────────────────────────
    defineField({
      name: 'flexPasses',
      title: 'Flex Passes',
      type: 'object',
      group: 'flex',
      description: 'Day passes and punch cards without a contract commitment.',
      fields: [
        // Day Pass
        defineField({
          name: 'dayPass',
          title: 'Day Pass (Tageskarte)',
          type: 'object',
          fields: [
            defineField({name: 'enabled', title: 'Show Day Pass', type: 'boolean', initialValue: false}),
            defineField({name: 'label', title: 'Label', type: 'string', initialValue: 'Tageskarte'}),
            defineField({name: 'price', title: 'Price (€)', type: 'number', validation: (Rule) => Rule.positive()}),
            defineField({name: 'note', title: 'Note', type: 'string'}),
          ],
        }),
        // 10-Card
        defineField({
          name: 'tenCard',
          title: '10-Card (10er-Karte)',
          type: 'object',
          fields: [
            defineField({name: 'enabled', title: 'Show 10-Card', type: 'boolean', initialValue: false}),
            defineField({name: 'label', title: 'Label', type: 'string', initialValue: '10er-Karte'}),
            defineField({name: 'price', title: 'Total Price (€)', type: 'number', validation: (Rule) => Rule.positive()}),
            defineField({
              name: 'pricePerVisit',
              title: 'Price per Visit (€)',
              type: 'number',
              description: 'Display value — enter the calculated per-visit cost',
              validation: (Rule) => Rule.positive(),
            }),
            defineField({name: 'note', title: 'Note', type: 'string'}),
          ],
        }),
        // 20-Card
        defineField({
          name: 'twentyCard',
          title: '20-Card (20er-Karte)',
          type: 'object',
          fields: [
            defineField({name: 'enabled', title: 'Show 20-Card', type: 'boolean', initialValue: false}),
            defineField({name: 'label', title: 'Label', type: 'string', initialValue: '20er-Karte'}),
            defineField({name: 'price', title: 'Total Price (€)', type: 'number', validation: (Rule) => Rule.positive()}),
            defineField({
              name: 'pricePerVisit',
              title: 'Price per Visit (€)',
              type: 'number',
              description: 'Display value — enter the calculated per-visit cost',
              validation: (Rule) => Rule.positive(),
            }),
            defineField({name: 'note', title: 'Note', type: 'string'}),
          ],
        }),
      ],
    }),

    // ── Personal Training Pricing ────────────────────────────────
    defineField({
      name: 'personalTraining',
      title: 'Personal Training',
      type: 'object',
      group: 'pt',
      fields: [
        defineField({
          name: 'label',
          title: 'Section Label',
          type: 'string',
          initialValue: 'Personal Training',
        }),
        defineField({
          name: 'icon',
          title: 'Icon (Font Awesome class)',
          type: 'string',
          initialValue: 'fa-user-check',
        }),

        // For Members
        defineField({
          name: 'forMembers',
          title: 'For Members',
          type: 'object',
          fields: [
            defineField({name: 'pricePerSession', title: 'Price per Session (€)', type: 'number', validation: (Rule) => Rule.required().positive()}),
            defineField({name: 'comparePrice', title: 'Strike-Through Price per Session (€)', type: 'number', validation: (Rule) => Rule.positive()}),
            defineField({name: 'savingsText', title: 'Savings Text', type: 'string'}),
            defineField({name: 'tenCardPrice', title: '10-Card Total Price (€)', type: 'number', validation: (Rule) => Rule.positive()}),
            defineField({name: 'tenCardPricePerUnit', title: '10-Card Price per Session (€)', type: 'number', validation: (Rule) => Rule.positive()}),
            defineField({name: 'note', title: 'Note', type: 'string'}),
          ],
        }),

        // For Non-Members
        defineField({
          name: 'forNonMembers',
          title: 'For Non-Members',
          type: 'object',
          fields: [
            defineField({name: 'pricePerSession', title: 'Price per Session (€)', type: 'number', validation: (Rule) => Rule.required().positive()}),
            defineField({name: 'comparePrice', title: 'Strike-Through Price per Session (€)', type: 'number', validation: (Rule) => Rule.positive()}),
            defineField({name: 'tenCardPrice', title: '10-Card Total Price (€)', type: 'number', validation: (Rule) => Rule.positive()}),
            defineField({name: 'tenCardPricePerUnit', title: '10-Card Price per Session (€)', type: 'number', validation: (Rule) => Rule.positive()}),
            defineField({name: 'note', title: 'Note', type: 'string'}),
          ],
        }),
      ],
    }),

    // ── Corporate (label only — detail in corporateBoxing module) ─
    defineField({
      name: 'corporate',
      title: 'Corporate',
      type: 'object',
      group: 'corporate',
      description: 'Display label shown on the pricing overview. Full module config lives in the Corporate Boxing document.',
      fields: [
        defineField({
          name: 'label',
          title: 'Label',
          type: 'string',
          initialValue: 'Corporate Boxing',
        }),
        defineField({
          name: 'icon',
          title: 'Icon (Font Awesome class)',
          type: 'string',
          initialValue: 'fa-building',
        }),
        defineField({
          name: 'priceLabel',
          title: 'Price Label',
          type: 'string',
          description: 'e.g. "Auf Anfrage"',
          initialValue: 'Auf Anfrage',
        }),
        defineField({
          name: 'note',
          title: 'Note',
          type: 'string',
          description: 'e.g. "Pakete für Teams ab 5 Personen"',
        }),
      ],
    }),
  ],

  preview: {
    prepare() {
      return {title: 'Pricing'}
    },
  },
})
