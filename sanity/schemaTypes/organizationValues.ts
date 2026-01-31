import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'organizationValues',
  title: 'Organization Values',
  type: 'document',
  fields: [
    defineField({
      name: 'mission',
      title: 'Mission Statement',
      type: 'text',
      description: 'The organization\'s mission statement',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'vision',
      title: 'Vision Statement',
      type: 'text',
      description: 'The organization\'s vision statement',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'values',
      title: 'Core Values',
      type: 'text',
      description: 'The organization\'s core values',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Organization Values',
        subtitle: 'Mission, Vision & Values',
      }
    },
  },
})
