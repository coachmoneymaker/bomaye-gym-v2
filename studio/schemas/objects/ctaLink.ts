import {defineType, defineField} from 'sanity'

/**
 * Reusable CTA link object — used in homepage sections, teasers, etc.
 */
export const ctaLink = defineType({
  name: 'ctaLink',
  title: 'CTA Link',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Button Label',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'href',
      title: 'URL / Anchor',
      type: 'string',
      description: 'Absolute URL, relative path, or anchor (e.g. #pricing)',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {title: 'label', subtitle: 'href'},
  },
})
