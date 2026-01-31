import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'signatureEvent',
  title: 'Signature Event',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'Event ID',
      type: 'string',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Order in which to display (lower numbers first)',
      validation: (Rule) => Rule.integer().min(0),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
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
      name: 'icon',
      title: 'Icon SVG Path',
      type: 'string',
      description: 'SVG path data for the event icon (d attribute)',
    }),
    defineField({
      name: 'badge',
      title: 'Badge Text',
      type: 'string',
      description: 'Optional badge text, e.g., "FREE", "NEW"',
    }),
    defineField({
      name: 'badgeColor',
      title: 'Badge Color Class',
      type: 'string',
      description: 'Tailwind background color class, e.g., "bg-emerald-500"',
    }),
    defineField({
      name: 'features',
      title: 'Features',
      type: 'array',
      of: [{type: 'string'}],
      description: 'List of features included in this event',
    }),
    defineField({
      name: 'benefits',
      title: 'Benefits',
      type: 'array',
      of: [{type: 'string'}],
      description: 'List of benefits from attending',
    }),
    defineField({
      name: 'duration',
      title: 'Duration',
      type: 'string',
      description: 'e.g., "60 minutes", "Half-day", "2-4 hours"',
    }),
    defineField({
      name: 'format',
      title: 'Format',
      type: 'string',
      description: 'e.g., "In-person", "Virtual", "At Your Location"',
    }),
    defineField({
      name: 'capacity',
      title: 'Capacity',
      type: 'string',
      description: 'e.g., "Up to 5 participants", "Teams of any size"',
    }),
    defineField({
      name: 'price',
      title: 'Price Display',
      type: 'string',
      description: 'Price text to display, e.g., "Complimentary lunch included", "$500"',
    }),
    defineField({
      name: 'special',
      title: 'Special Note',
      type: 'string',
      description: 'Special highlight, e.g., "100% Results Guaranteed"',
    }),
    defineField({
      name: 'color',
      title: 'Gradient Color Classes',
      type: 'string',
      description: 'Tailwind gradient classes, e.g., "from-emerald-500 to-emerald-600"',
    }),
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
    {
      title: 'Title',
      name: 'titleAsc',
      by: [{field: 'title', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'subtitle',
      badge: 'badge',
    },
    prepare({title, subtitle, badge}) {
      return {
        title: title || 'Untitled Event',
        subtitle: badge ? `${badge} - ${subtitle}` : subtitle,
      }
    },
  },
})

