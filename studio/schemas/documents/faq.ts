import {defineType, defineField, defineArrayMember} from 'sanity'

/**
 * faq — singleton
 * Mirrors BOMAYE_FAQ in faq-data.js.
 * An ordered list of categories, each with an ordered list of Q&A items.
 * Editors can add, remove, and reorder categories and questions without touching code.
 */
export const faq = defineType({
  name: 'faq',
  title: 'FAQ',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  fields: [
    defineField({
      name: 'categories',
      title: 'FAQ Categories',
      type: 'array',
      description:
        'Add, reorder, or remove FAQ categories. Each category contains its own list of questions.',
      of: [
        defineArrayMember({
          name: 'faqCategory',
          title: 'Category',
          type: 'object',
          fields: [
            defineField({
              name: 'category',
              title: 'Category Label',
              type: 'string',
              description: 'Shown as a filter pill on the FAQ page, e.g. "Mitgliedschaft"',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'id',
              title: 'Category ID (slug)',
              type: 'slug',
              description:
                'Used by the frontend to identify this category. Auto-generated from the label.',
              options: {source: 'category'},
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'items',
              title: 'Questions & Answers',
              type: 'array',
              description: 'Add, reorder, or remove Q&A items in this category.',
              of: [
                defineArrayMember({
                  name: 'faqItem',
                  title: 'Q&A',
                  type: 'object',
                  fields: [
                    defineField({
                      name: 'q',
                      title: 'Question',
                      type: 'string',
                      validation: (Rule) => Rule.required(),
                    }),
                    defineField({
                      name: 'a',
                      title: 'Answer',
                      type: 'text',
                      rows: 4,
                      validation: (Rule) => Rule.required(),
                    }),
                  ],
                  preview: {
                    select: {title: 'q', subtitle: 'a'},
                    prepare({title, subtitle}) {
                      return {
                        title: title ?? 'Untitled question',
                        subtitle: subtitle,
                      }
                    },
                  },
                }),
              ],
            }),
          ],
          preview: {
            select: {title: 'category', items: 'items'},
            prepare({title, items}) {
              const count = Array.isArray(items) ? items.length : 0
              return {
                title: title ?? 'Untitled category',
                subtitle: `${count} question${count !== 1 ? 's' : ''}`,
              }
            },
          },
        }),
      ],
    }),
  ],

  preview: {
    prepare() {
      return {title: 'FAQ'}
    },
  },
})
