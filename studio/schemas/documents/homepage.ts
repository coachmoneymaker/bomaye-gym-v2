import {defineType, defineField} from 'sanity'

/**
 * homepage — singleton
 * Every editable section on the homepage lives here.
 * No section copy is hard-coded in HTML — all text, labels, and
 * enable/disable flags are driven from this document.
 */
export const homepage = defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  groups: [
    {name: 'hero', title: 'Hero'},
    {name: 'announcement', title: 'Announcement Bar'},
    {name: 'earlyBird', title: 'Early Bird'},
    {name: 'membership', title: 'Membership Intro'},
    {name: 'family', title: 'Family Benefit Teaser'},
    {name: 'pt', title: 'Personal Training Teaser'},
    {name: 'corporate', title: 'Corporate Boxing Teaser'},
    {name: 'faq', title: 'FAQ Teaser & SEO'},
  ],
  fields: [
    // ── Hero ────────────────────────────────────────────────────
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      group: 'hero',
      fields: [
        defineField({
          name: 'badge',
          title: 'Badge / Top Label',
          type: 'string',
          description: 'Short label above the headline, e.g. "NOW OPEN · EARLY BIRD ACTIVE"',
        }),
        defineField({
          name: 'headline',
          title: 'Headline (H1)',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'subheadline',
          title: 'Subheadline',
          type: 'text',
          rows: 2,
        }),
        defineField({
          name: 'ctaPrimary',
          title: 'Primary CTA',
          type: 'ctaLink',
        }),
        defineField({
          name: 'ctaSecondary',
          title: 'Secondary CTA',
          type: 'ctaLink',
        }),
      ],
    }),

    // ── Announcement Bar ─────────────────────────────────────────
    defineField({
      name: 'announcement',
      title: 'Announcement Bar',
      type: 'object',
      group: 'announcement',
      description: 'Top-of-page sticky banner. Toggle enabled to show/hide.',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Show Announcement Bar',
          type: 'boolean',
          initialValue: false,
        }),
        defineField({
          name: 'text',
          title: 'Announcement Text',
          type: 'string',
          hidden: ({parent}) => !parent?.enabled,
        }),
        defineField({
          name: 'linkHref',
          title: 'Optional Link URL',
          type: 'string',
          description: 'Turns the announcement text into a clickable link',
          hidden: ({parent}) => !parent?.enabled,
        }),
      ],
    }),

    // ── Early Bird Section ───────────────────────────────────────
    defineField({
      name: 'earlyBird',
      title: 'Early Bird Section',
      type: 'object',
      group: 'earlyBird',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Show Early Bird Section',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'sectionBadge',
          title: 'Section Badge',
          type: 'string',
          description: 'e.g. "EARLY BIRD OFFER"',
          hidden: ({parent}) => !parent?.enabled,
        }),
        defineField({
          name: 'headline',
          title: 'Headline',
          type: 'string',
          hidden: ({parent}) => !parent?.enabled,
        }),
        defineField({
          name: 'subtext',
          title: 'Subtext',
          type: 'text',
          rows: 2,
          hidden: ({parent}) => !parent?.enabled,
        }),
        defineField({
          name: 'spotsLabel',
          title: 'Spots Label',
          type: 'string',
          description:
            'Use {n} as placeholder for the live spot count, e.g. "Noch {n} Early-Bird-Plätze verfügbar"',
          hidden: ({parent}) => !parent?.enabled,
        }),
        defineField({
          name: 'spotsBarEnabled',
          title: 'Show Spots Progress Bar',
          type: 'boolean',
          initialValue: true,
          hidden: ({parent}) => !parent?.enabled,
        }),
        defineField({
          name: 'cta',
          title: 'CTA Button',
          type: 'ctaLink',
          hidden: ({parent}) => !parent?.enabled,
        }),
      ],
    }),

    // ── Membership Intro ─────────────────────────────────────────
    defineField({
      name: 'membershipIntro',
      title: 'Membership Intro',
      type: 'object',
      group: 'membership',
      fields: [
        defineField({
          name: 'sectionBadge',
          title: 'Section Badge',
          type: 'string',
        }),
        defineField({
          name: 'headline',
          title: 'Headline',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'subtext',
          title: 'Subtext',
          type: 'text',
          rows: 3,
        }),
        defineField({
          name: 'cta',
          title: 'CTA Button',
          type: 'ctaLink',
        }),
      ],
    }),

    // ── Family Benefit Teaser ────────────────────────────────────
    defineField({
      name: 'familyBenefitTeaser',
      title: 'Family Benefit Teaser',
      type: 'object',
      group: 'family',
      description:
        'Teaser tile that opens the Family Benefit modal. Mirrors the master switch in the Family Benefit module.',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Show Family Benefit Teaser',
          type: 'boolean',
          description: 'Must also be enabled in the Family Benefit module to have any effect.',
          initialValue: false,
        }),
        defineField({
          name: 'sectionBadge',
          title: 'Section Badge',
          type: 'string',
          hidden: ({parent}) => !parent?.enabled,
        }),
        defineField({
          name: 'headline',
          title: 'Headline',
          type: 'string',
          hidden: ({parent}) => !parent?.enabled,
        }),
        defineField({
          name: 'subtext',
          title: 'Subtext',
          type: 'text',
          rows: 2,
          hidden: ({parent}) => !parent?.enabled,
        }),
        defineField({
          name: 'ctaLabel',
          title: 'CTA Button Label',
          type: 'string',
          description: 'Opens the family benefit modal (no href needed)',
          hidden: ({parent}) => !parent?.enabled,
        }),
      ],
    }),

    // ── Personal Training Teaser ─────────────────────────────────
    defineField({
      name: 'personalTrainingTeaser',
      title: 'Personal Training Teaser',
      type: 'object',
      group: 'pt',
      fields: [
        defineField({
          name: 'sectionBadge',
          title: 'Section Badge',
          type: 'string',
        }),
        defineField({
          name: 'headline',
          title: 'Headline',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'subtext',
          title: 'Subtext',
          type: 'text',
          rows: 2,
        }),
        defineField({
          name: 'bulletPoints',
          title: 'Bullet Points',
          type: 'array',
          of: [{type: 'string'}],
          description: 'USP list shown inside the teaser tile',
        }),
        defineField({
          name: 'cta',
          title: 'CTA Button',
          type: 'ctaLink',
        }),
      ],
    }),

    // ── Corporate Boxing Teaser ──────────────────────────────────
    defineField({
      name: 'corporateBoxingTeaser',
      title: 'Corporate Boxing Teaser',
      type: 'object',
      group: 'corporate',
      description:
        'Teaser tile that opens the Corporate Boxing modal. Mirrors the master switch in the Corporate Boxing module.',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Show Corporate Boxing Teaser',
          type: 'boolean',
          initialValue: false,
        }),
        defineField({
          name: 'sectionBadge',
          title: 'Section Badge',
          type: 'string',
          hidden: ({parent}) => !parent?.enabled,
        }),
        defineField({
          name: 'headline',
          title: 'Headline',
          type: 'string',
          hidden: ({parent}) => !parent?.enabled,
        }),
        defineField({
          name: 'subtext',
          title: 'Subtext',
          type: 'text',
          rows: 2,
          hidden: ({parent}) => !parent?.enabled,
        }),
        defineField({
          name: 'ctaLabel',
          title: 'CTA Button Label',
          type: 'string',
          description: 'Opens the corporate boxing modal (no href needed)',
          hidden: ({parent}) => !parent?.enabled,
        }),
      ],
    }),

    // ── FAQ Teaser & SEO Footer ──────────────────────────────────
    defineField({
      name: 'faqTeaser',
      title: 'FAQ Teaser & SEO',
      type: 'object',
      group: 'faq',
      fields: [
        defineField({
          name: 'sectionBadge',
          title: 'Section Badge',
          type: 'string',
        }),
        defineField({
          name: 'headline',
          title: 'Headline',
          type: 'string',
        }),
        defineField({
          name: 'subtext',
          title: 'Subtext',
          type: 'text',
          rows: 2,
        }),
        defineField({
          name: 'cta',
          title: 'CTA Button',
          type: 'ctaLink',
        }),
        defineField({
          name: 'seoFooterText',
          title: 'SEO Footer Text',
          type: 'text',
          rows: 6,
          description:
            'Rendered below the fold for on-page SEO (not shown prominently to users). Plain text or minimal HTML.',
        }),
      ],
    }),
  ],

  preview: {
    prepare() {
      return {title: 'Homepage'}
    },
  },
})
