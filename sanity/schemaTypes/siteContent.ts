import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'siteContent',
  title: 'Site Content',
  type: 'document',
  fields: [
    defineField({
      name: 'page',
      title: 'Page',
      type: 'string',
    }),
    defineField({
      name: 'key',
      title: 'Key',
      type: 'string',
    }),
    defineField({
      name: 'value',
      title: 'Value',
      type: 'text',
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
    }),
  ],
})

