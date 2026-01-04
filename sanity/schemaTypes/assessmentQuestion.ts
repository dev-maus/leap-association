import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'assessmentQuestion',
  title: 'Assessment Question',
  type: 'document',
  fields: [
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Habit', value: 'habit'},
          {title: 'Ability', value: 'ability'},
          {title: 'Talent', value: 'talent'},
          {title: 'Skill', value: 'skill'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'assessmentType',
      title: 'Assessment Type',
      type: 'string',
      options: {
        list: [
          {title: 'Individual', value: 'individual'},
          {title: 'Team', value: 'team'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'text',
      title: 'Question Text',
      type: 'text',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Display order within the assessment',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'ratingOptions',
      title: 'Rating Options',
      type: 'array',
      description: 'Rating options in order (first = highest points)',
      validation: (Rule) => Rule.required().min(2).max(7),
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'points',
              title: 'Points',
              type: 'number',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              label: 'label',
              points: 'points',
            },
            prepare({label, points}) {
              return {
                title: `${label} (${points} pts)`,
              }
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'text',
      category: 'category',
      assessmentType: 'assessmentType',
      order: 'order',
    },
    prepare({title, category, assessmentType, order}) {
      return {
        title: title || 'Untitled',
        subtitle: `${assessmentType} - ${category} (#${order})`,
      }
    },
  },
  orderings: [
    {
      title: 'Order',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
  ],
})

