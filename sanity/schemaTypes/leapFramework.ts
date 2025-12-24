import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'leapFramework',
  title: 'LEAP Framework',
  type: 'document',
  fields: [
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
})

