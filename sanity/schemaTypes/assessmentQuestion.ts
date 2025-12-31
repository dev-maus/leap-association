import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'assessmentQuestion',
  title: 'Assessment Question',
  type: 'document',
  fields: [
    defineField({
      name: 'questionId',
      title: 'Question ID',
      type: 'string',
      description: 'Unique identifier (e.g., h1, a2, t3)',
      validation: (Rule) => Rule.required(),
    }),
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

