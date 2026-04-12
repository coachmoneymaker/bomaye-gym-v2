import {defineType, defineField} from 'sanity'

/**
 * Configurable form field — used in familyBenefit and corporateBoxing modals.
 * Adding or removing fields here updates the rendered form without HTML changes.
 */
export const formField = defineType({
  name: 'formField',
  title: 'Form Field',
  type: 'object',
  fields: [
    defineField({
      name: 'id',
      title: 'Field ID',
      type: 'string',
      description: 'Unique key used as input name/id attribute (no spaces, e.g. "firstName")',
      validation: (Rule) =>
        Rule.required().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, {
          name: 'identifier',
          invert: false,
        }),
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Field Type',
      type: 'string',
      options: {
        list: [
          {title: 'Text', value: 'text'},
          {title: 'Email', value: 'email'},
          {title: 'Phone', value: 'tel'},
          {title: 'Dropdown / Select', value: 'select'},
          {title: 'Textarea', value: 'textarea'},
          {title: 'Checkbox', value: 'checkbox'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'placeholder',
      title: 'Placeholder Text',
      type: 'string',
      hidden: ({parent}) => parent?.type === 'checkbox',
    }),
    defineField({
      name: 'options',
      title: 'Dropdown Options',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Only used when Field Type is "Dropdown / Select"',
      hidden: ({parent}) => parent?.type !== 'select',
    }),
    defineField({
      name: 'required',
      title: 'Required Field',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Fields are rendered in ascending order (1, 2, 3 …)',
      validation: (Rule) => Rule.required().integer().positive(),
    }),
  ],
  preview: {
    select: {
      title: 'label',
      subtitle: 'type',
      order: 'order',
    },
    prepare({title, subtitle, order}) {
      return {
        title: `${order ?? '?'}. ${title}`,
        subtitle: subtitle,
      }
    },
  },
})
