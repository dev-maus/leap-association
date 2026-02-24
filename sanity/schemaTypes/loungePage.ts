import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'loungePage',
  title: 'LEAP Lounge Page',
  type: 'document',
  fields: [
    defineField({
      name: 'heroBadge',
      title: 'Hero Badge',
      type: 'string',
      description: 'Small label above the main heading',
    }),
    defineField({
      name: 'heroHeading',
      title: 'Hero Heading',
      type: 'string',
    }),
    defineField({
      name: 'heroDescription',
      title: 'Hero Description',
      type: 'text',
    }),
    defineField({
      name: 'overviewCards',
      title: 'Overview Cards',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'loungeOverviewCard',
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'description', title: 'Description', type: 'text' }),
            defineField({ name: 'icon', title: 'Icon SVG Path', type: 'string' }),
            defineField({ name: 'color', title: 'Gradient Classes', type: 'string' }),
          ],
        },
      ],
    }),
    defineField({
      name: 'amenities',
      title: 'Amenities',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'loungeAmenity',
          fields: [
            defineField({ name: 'name', title: 'Name', type: 'string' }),
            defineField({ name: 'description', title: 'Description', type: 'string' }),
            defineField({ name: 'icon', title: 'Icon SVG Path', type: 'string' }),
          ],
        },
      ],
    }),
    defineField({
      name: 'packages',
      title: 'Pricing Packages',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'loungePackage',
          fields: [
            defineField({ name: 'name', title: 'Name', type: 'string' }),
            defineField({ name: 'price', title: 'Price', type: 'string' }),
            defineField({ name: 'duration', title: 'Duration', type: 'string' }),
            defineField({ name: 'capacity', title: 'Capacity', type: 'string' }),
            defineField({ name: 'color', title: 'Gradient Classes', type: 'string' }),
            defineField({ name: 'popular', title: 'Mark as Popular', type: 'boolean', initialValue: false }),
            defineField({
              name: 'includes',
              title: 'Includes',
              type: 'array',
              of: [{ type: 'string' }],
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'ctaHeading',
      title: 'CTA Heading',
      type: 'string',
    }),
    defineField({
      name: 'ctaDescription',
      title: 'CTA Description',
      type: 'text',
    }),
  ],
  preview: {
    prepare() {
      return { title: 'LEAP Lounge Page', subtitle: 'Venue and packages content' }
    },
  },
})
