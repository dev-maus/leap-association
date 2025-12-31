import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'assessmentSettings',
  title: 'Assessment Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'ratingLabels',
      title: 'Rating Labels',
      type: 'object',
      description: 'Labels for the 1-5 rating scale',
      fields: [
        defineField({
          name: 'rating1',
          title: 'Rating 1 Label',
          type: 'string',
          initialValue: 'Strongly Disagree',
        }),
        defineField({
          name: 'rating2',
          title: 'Rating 2 Label',
          type: 'string',
          initialValue: 'Disagree',
        }),
        defineField({
          name: 'rating3',
          title: 'Rating 3 Label',
          type: 'string',
          initialValue: 'Neutral',
        }),
        defineField({
          name: 'rating4',
          title: 'Rating 4 Label',
          type: 'string',
          initialValue: 'Agree',
        }),
        defineField({
          name: 'rating5',
          title: 'Rating 5 Label',
          type: 'string',
          initialValue: 'Strongly Agree',
        }),
      ],
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Assessment Settings',
      }
    },
  },
})

