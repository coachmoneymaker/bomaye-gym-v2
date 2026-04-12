import {defineType, defineField, defineArrayMember} from 'sanity'

/**
 * familyBenefit — singleton
 * Self-contained module for the family discount / inquiry feature.
 * Drives both the homepage teaser tile and the full modal + form.
 *
 * Master switch: enabled = false → teaser hidden, modal unreachable, no form submissions.
 */
export const familyBenefit = defineType({
  name: 'familyBenefit',
  title: 'Family Benefit',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  groups: [
    {name: 'general', title: 'Master Switch'},
    {name: 'teaser', title: 'Teaser (Homepage Tile)'},
    {name: 'modal', title: 'Modal Content'},
    {name: 'form', title: 'Form & Submission'},
  ],
  fields: [
    // ── Master Switch ────────────────────────────────────────────
    defineField({
      name: 'enabled',
      title: 'Enable Family Benefit',
      type: 'boolean',
      group: 'general',
      description:
        'When disabled, the homepage teaser is hidden and the modal cannot be opened. No form submissions are possible.',
      initialValue: false,
    }),

    // ── Teaser (Homepage Tile) ───────────────────────────────────
    defineField({
      name: 'teaser',
      title: 'Teaser',
      type: 'object',
      group: 'teaser',
      description: 'Short copy shown on the homepage family benefit tile.',
      fields: [
        defineField({
          name: 'label',
          title: 'Badge / Chip Label',
          type: 'string',
          description: 'e.g. "FAMILIEN-VORTEIL"',
        }),
        defineField({
          name: 'text',
          title: 'Teaser Text',
          type: 'text',
          rows: 2,
          description: '1–2 sentence hook shown on the homepage tile',
        }),
      ],
    }),

    // ── Modal Content ────────────────────────────────────────────
    defineField({
      name: 'modal',
      title: 'Modal',
      type: 'object',
      group: 'modal',
      fields: [
        defineField({
          name: 'title',
          title: 'Modal Title',
          type: 'string',
          description: 'Heading shown at the top of the modal',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'supportText',
          title: 'Support Text',
          type: 'text',
          rows: 3,
          description: 'Paragraph shown beneath the modal title',
        }),
        defineField({
          name: 'bulletPoints',
          title: 'Benefit Bullet Points',
          type: 'array',
          of: [{type: 'string'}],
          description: 'List of family benefit selling points shown inside the modal',
        }),
        defineField({
          name: 'formTitle',
          title: 'Form Section Title',
          type: 'string',
          description: 'Heading shown directly above the form fields',
        }),
      ],
    }),

    // ── Form Fields ──────────────────────────────────────────────
    defineField({
      name: 'form',
      title: 'Form',
      type: 'object',
      group: 'form',
      fields: [
        defineField({
          name: 'fields',
          title: 'Form Fields',
          type: 'array',
          of: [defineArrayMember({type: 'formField'})],
          description:
            'Configure which fields appear in the family benefit inquiry form. Fields are rendered in ascending "order" number.',
        }),
        defineField({
          name: 'submitLabel',
          title: 'Submit Button Label',
          type: 'string',
          description: 'e.g. "Anfrage senden"',
          initialValue: 'Anfrage senden',
        }),
        defineField({
          name: 'recipientEmail',
          title: 'Recipient Email',
          type: 'string',
          description: 'Email address that receives family benefit form submissions',
          validation: (Rule) => Rule.email(),
        }),
      ],
    }),

    // ── Success Message ──────────────────────────────────────────
    defineField({
      name: 'successMessage',
      title: 'Success Message',
      type: 'object',
      group: 'form',
      description: 'Shown to the user after a successful form submission',
      fields: [
        defineField({
          name: 'title',
          title: 'Title',
          type: 'string',
          description: 'e.g. "Anfrage gesendet!"',
          initialValue: 'Anfrage gesendet!',
        }),
        defineField({
          name: 'text',
          title: 'Confirmation Text',
          type: 'text',
          rows: 3,
          description: 'Confirmation copy shown after the form is submitted successfully',
        }),
      ],
    }),
  ],

  preview: {
    select: {enabled: 'enabled'},
    prepare({enabled}) {
      return {
        title: 'Family Benefit',
        subtitle: enabled ? 'Enabled' : 'Disabled',
      }
    },
  },
})
