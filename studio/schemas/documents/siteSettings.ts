import {defineType, defineField} from 'sanity'

/**
 * siteSettings — singleton
 * Mirrors the existing config.js BOMAYE object:
 * contact, address, opening hours, early-bird counter, opening status.
 */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  // Prevent duplicate creation via Sanity's "Create new document" UI
  __experimental_actions: ['update', 'publish'],
  fields: [
    // ── Opening Status ─────────────────────────────────────────
    defineField({
      name: 'openingStatus',
      title: 'Opening Status',
      type: 'string',
      description: 'Shown in the site header/hero. e.g. "Opening Soon" or "Now Open"',
      validation: (Rule) => Rule.required(),
    }),

    // ── Early Bird Counter ──────────────────────────────────────
    defineField({
      name: 'earlyBird',
      title: 'Early Bird Counter',
      type: 'object',
      fields: [
        defineField({
          name: 'total',
          title: 'Total Spots Offered',
          type: 'number',
          validation: (Rule) => Rule.required().integer().positive(),
        }),
        defineField({
          name: 'remaining',
          title: 'Remaining Spots',
          description: 'Fallback value used when earlybird.json cannot be fetched',
          type: 'number',
          validation: (Rule) => Rule.required().integer().min(0),
        }),
      ],
    }),

    // ── Contact ─────────────────────────────────────────────────
    defineField({
      name: 'contact',
      title: 'Contact',
      type: 'object',
      fields: [
        defineField({
          name: 'phoneDisplay',
          title: 'Phone Number (display)',
          type: 'string',
          description: 'Human-readable format, e.g. "0176 2193 2243"',
        }),
        defineField({
          name: 'phoneHref',
          title: 'Phone Number (href)',
          type: 'string',
          description: 'For tel: links, e.g. "+4917621932243"',
        }),
        defineField({
          name: 'whatsappHref',
          title: 'WhatsApp Number (href)',
          type: 'string',
          description: 'Digits only, e.g. "4917621932243"',
        }),
        defineField({
          name: 'email',
          title: 'Email Address',
          type: 'string',
          validation: (Rule) => Rule.email(),
        }),
        defineField({
          name: 'instagram',
          title: 'Instagram URL',
          type: 'url',
        }),
        defineField({
          name: 'youtube',
          title: 'YouTube URL',
          type: 'url',
        }),
        defineField({
          name: 'tiktok',
          title: 'TikTok URL',
          type: 'url',
        }),
      ],
    }),

    // ── Address ─────────────────────────────────────────────────
    defineField({
      name: 'address',
      title: 'Address',
      type: 'object',
      fields: [
        defineField({
          name: 'street',
          title: 'Street',
          type: 'string',
        }),
        defineField({
          name: 'area',
          title: 'Area / Building Name',
          type: 'string',
          description: 'e.g. "Tiefhof Pineapple Park"',
        }),
        defineField({
          name: 'city',
          title: 'City + Postcode',
          type: 'string',
          description: 'e.g. "80639 München"',
        }),
        defineField({
          name: 'transport',
          title: 'Public Transport Note',
          type: 'string',
          description: 'e.g. "S-Bahn Hirschgarten (5 Min.)"',
        }),
        defineField({
          name: 'mapLat',
          title: 'Map Latitude',
          type: 'number',
        }),
        defineField({
          name: 'mapLon',
          title: 'Map Longitude',
          type: 'number',
        }),
      ],
    }),

    // ── Opening Hours ────────────────────────────────────────────
    defineField({
      name: 'hours',
      title: 'Opening Hours',
      type: 'object',
      fields: [
        defineField({
          name: 'weekdays',
          title: 'Monday – Friday',
          type: 'string',
          description: 'e.g. "07:00 – 22:00 Uhr"',
        }),
        defineField({
          name: 'saturday',
          title: 'Saturday',
          type: 'string',
        }),
        defineField({
          name: 'sunday',
          title: 'Sunday',
          type: 'string',
          description: 'e.g. "Geschlossen"',
        }),
      ],
    }),
  ],

  preview: {
    prepare() {
      return {title: 'Site Settings'}
    },
  },
})
