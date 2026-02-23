import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'corePhilosophy',
  title: 'Core Philosophy',
  type: 'document',
  fields: [
    defineField({
      name: 'sectionLabel',
      title: 'Section Label',
      type: 'string',
      description: 'Label shown above the heading, e.g., "Core Philosophy"',
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'Main heading, e.g., "You Are Always Practicing"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Main paragraph describing the philosophy',
      rows: 4,
    }),
    defineField({
      name: 'principles',
      title: 'Principles',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'principle',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'string',
            }),
            defineField({
              name: 'color',
              title: 'Color Class',
              type: 'string',
              description: 'Tailwind color class, e.g., "blue", "purple", "amber"',
            }),
          ],
          preview: {
            select: {
              title: 'title',
            },
          },
        },
      ],
    }),
    defineField({
      name: 'statValue',
      title: 'Statistic Value',
      type: 'string',
      description: 'The main statistic, e.g., "93%"',
    }),
    defineField({
      name: 'statLabel',
      title: 'Statistic Label',
      type: 'string',
      description: 'Label for the statistic',
    }),
    defineField({
      name: 'statDescription',
      title: 'Statistic Description',
      type: 'text',
      description: 'Additional context for the statistic',
      rows: 3,
    }),
  ],
  preview: {
    select: {
      title: 'heading',
    },
    prepare({title}) {
      return {
        title: title || 'Core Philosophy',
        subtitle: 'Philosophy section content',
      }
    },
  },
})
