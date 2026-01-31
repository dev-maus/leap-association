import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'statistic',
  title: 'Statistic',
  type: 'document',
  fields: [
    defineField({
      name: 'page',
      title: 'Page',
      type: 'string',
      description: 'Which page this statistic appears on',
      options: {
        list: [
          {title: 'Home', value: 'home'},
          {title: 'About', value: 'about'},
          {title: 'Solutions', value: 'solutions'},
          {title: 'Events', value: 'events'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Order in which to display (lower numbers first)',
      validation: (Rule) => Rule.required().integer().min(0),
    }),
    defineField({
      name: 'value',
      title: 'Value',
      type: 'string',
      description: 'The statistic value, e.g., "750+", "98%", "10,000+"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'Label describing the statistic, e.g., "Organizations Served"',
      validation: (Rule) => Rule.required(),
    }),
  ],
  orderings: [
    {
      title: 'Page then Order',
      name: 'pageOrder',
      by: [
        {field: 'page', direction: 'asc'},
        {field: 'order', direction: 'asc'},
      ],
    },
  ],
  preview: {
    select: {
      value: 'value',
      label: 'label',
      page: 'page',
    },
    prepare({value, label, page}) {
      return {
        title: `${value} - ${label}`,
        subtitle: `Page: ${page}`,
      }
    },
  },
})
