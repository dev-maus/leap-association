import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'service',
  title: 'Service',
  type: 'document',
  fields: [
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
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
      name: 'features',
      title: 'Features',
      type: 'array',
      of: [{type: 'string'}],
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
    }),
    defineField({
      name: 'subItems',
      title: 'Sub-items / Tracks / Offerings',
      type: 'array',
      description: 'e.g. training tracks (Leading Self, Others, Projects, Change) or consulting types (DRP, Readiness, Team Alignment)',
      of: [
        {
          type: 'object',
          name: 'serviceSubItem',
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'description', title: 'Description', type: 'string' }),
            defineField({
              name: 'slug',
              title: 'Link Slug',
              type: 'string',
              description: 'URL segment, e.g. leading-self, drp',
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'ctaHeading',
      title: 'CTA Heading',
      type: 'string',
      description: 'Bottom section heading, e.g. "Ready to Develop Your Leaders?"',
    }),
    defineField({
      name: 'ctaDescription',
      title: 'CTA Description',
      type: 'text',
    }),
  ],
})

