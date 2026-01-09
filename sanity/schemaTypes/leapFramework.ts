import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'leapFramework',
  title: 'LEAP Framework',
  type: 'document',
  fields: [
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Display order (lower numbers appear first)',
      validation: (Rule) => Rule.required().integer().min(0),
    }),
    defineField({
      name: 'letter',
      title: 'Letter',
      type: 'string',
      options: {
        list: ['L', 'E', 'A', 'P'],
      },
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'color',
      title: 'Color',
      type: 'string',
    }),
  ],
  orderings: [
    {
      title: 'Order',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
    {
      title: 'Order (Descending)',
      name: 'orderDesc',
      by: [{field: 'order', direction: 'desc'}],
    },
    {
      title: 'Letter',
      name: 'letterAsc',
      by: [{field: 'letter', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      letter: 'letter',
      order: 'order',
    },
    prepare({title, letter, order}) {
      return {
        title: title || 'Untitled',
        subtitle: `${letter} (Order: ${order})`,
      }
    },
  },
})

