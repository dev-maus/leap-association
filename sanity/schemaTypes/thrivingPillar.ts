import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'thrivingPillar',
  title: 'Thriving Framework Pillar',
  type: 'document',
  fields: [
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Order in which to display (lower numbers first)',
      validation: (Rule) => Rule.required().integer().min(0),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'e.g., "Repeatable", "Reliable", "Scalable"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Brief description of this pillar',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'icon',
      title: 'Icon SVG Path',
      type: 'string',
      description: 'SVG path data for the icon (d attribute)',
    }),
    defineField({
      name: 'color',
      title: 'Gradient Color Classes',
      type: 'string',
      description: 'Tailwind gradient classes, e.g., "from-blue-400 to-blue-500"',
    }),
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      order: 'order',
    },
    prepare({title, order}) {
      return {
        title: title || 'Untitled Pillar',
        subtitle: `Order: ${order}`,
      }
    },
  },
})
