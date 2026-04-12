import {defineType, defineField, defineArrayMember} from 'sanity'

/**
 * corporateBoxing — singleton
 * Self-contained module for the corporate boxing product.
 * Drives both the homepage teaser tile and the full modal + form.
 *
 * Master switch: enabled = false → teaser hidden, modal unreachable, no form submissions.
 */
export const corporateBoxing = defineType({
  name: 'corporateBoxing',
  title: 'Corporate Boxing',
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
      title: 'Enable Corporate Boxing',
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
      description: 'Short copy shown on the homepage corporate boxing tile.',
      fields: [
        defineField({
          name: 'title',
          title: 'Teaser Title',
          type: 'string',
          description: 'Headline on the homepage tile',
          validation: (Rule) => Rule.required(),
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
          name: 'benefits',
          title: 'Benefits List',
          type: 'array',
          of: [{type: 'string'}],
          description:
            'Corporate program selling points rendered as a bullet list inside the modal',
        }),

        // Catering Option
        defineField({
          name: 'cateringOption',
          title: 'Catering Option',
          type: 'object',
          description: 'Optional catering add-on copy shown inside the modal',
          fields: [
            defineField({
              name: 'enabled',
              title: 'Show Catering Option',
              type: 'boolean',
              initialValue: false,
            }),
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              description: 'e.g. "Catering & Getränke buchbar"',
              hidden: ({parent}) => !parent?.enabled,
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 2,
              description: 'Brief catering details shown beneath the label',
              hidden: ({parent}) => !parent?.enabled,
            }),
          ],
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
            'Configure which fields appear in the corporate boxing inquiry form. Fields are rendered in ascending "order" number.',
        }),
        defineField({
          name: 'submitLabel',
          title: 'Submit Button Label',
          type: 'string',
          description: 'e.g. "Paket anfragen"',
          initialValue: 'Paket anfragen',
        }),
        defineField({
          name: 'recipientEmail',
          title: 'Recipient Email',
          type: 'string',
          description:
            'Email address that receives corporate boxing form submissions. Can differ from the family benefit recipient.',
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
          description: 'e.g. "Anfrage erhalten!"',
          initialValue: 'Anfrage erhalten!',
        }),
        defineField({
          name: 'text',
          title: 'Confirmation Text',
          type: 'text',
          rows: 3,
        }),
      ],
    }),
  ],

  preview: {
    select: {enabled: 'enabled'},
    prepare({enabled}) {
      return {
        title: 'Corporate Boxing',
        subtitle: enabled ? 'Enabled' : 'Disabled',
      }
    },
  },
})
