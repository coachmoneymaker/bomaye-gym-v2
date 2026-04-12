import {defineField, defineType} from 'sanity'

export const course = defineType({
  name: 'course',
  title: 'Course',
  type: 'document',
  icon: () => '🏋️',
  fields: [
    defineField({
      name: 'name',
      title: 'Course Name',
      type: 'string',
      description: 'e.g. "Olympic Boxing", "Kids Boxing", "Women\'s Boxing"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tag',
      title: 'Badge / Tag',
      type: 'string',
      description: 'Short label shown as a badge, e.g. "VEREIN", "EMPOWERMENT", "KIDS"',
    }),
    defineField({
      name: 'icon',
      title: 'Font Awesome Icon Class',
      type: 'string',
      description: 'e.g. "fa-trophy", "fa-child", "fa-venus"',
    }),
    defineField({
      name: 'ageGroups',
      title: 'Age Groups',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'Kids (6–9)', value: 'kids'},
          {title: 'Youth (10–17)', value: 'jugend'},
          {title: 'Adults (18+)', value: 'erwachsene'},
        ],
      },
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'string',
      description: 'Shown in cards and teasers',
    }),
    defineField({
      name: 'description',
      title: 'Full Description',
      type: 'text',
      rows: 6,
    }),
    defineField({
      name: 'image',
      title: 'Course Image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'coach',
      title: 'Lead Coach',
      type: 'reference',
      to: [{type: 'coach'}],
    }),
    defineField({
      name: 'highlights',
      title: 'Highlights / Bullet Points',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Key selling points shown in course detail views',
    }),
    defineField({
      name: 'scheduleNote',
      title: 'Schedule Note',
      type: 'string',
      description: 'e.g. "Mo, Mi, Fr – 19:00 Uhr"',
    }),
    defineField({
      name: 'enabled',
      title: 'Active / Visible',
      type: 'boolean',
      description: 'Uncheck to hide this course from the site',
      initialValue: true,
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'shortDescription',
      media: 'image',
    },
  },
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
  ],
})
