import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'industryServed',
  title: 'Industry Served',
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
      name: 'name',
      title: 'Industry Name',
      type: 'string',
      description: 'e.g., "Technology", "Healthcare", "Manufacturing"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'count',
      title: 'Count',
      type: 'string',
      description: 'Number of organizations served, e.g., "150+"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'icon',
      title: 'Icon SVG Path',
      type: 'string',
      description: 'SVG path data for the icon (d attribute)',
    }),
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
    {
      title: 'Name',
      name: 'nameAsc',
      by: [{field: 'name', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      name: 'name',
      count: 'count',
      order: 'order',
    },
    prepare({name, count, order}) {
      return {
        title: name || 'Unnamed Industry',
        subtitle: `${count} organizations (Order: ${order})`,
      }
    },
  },
})
