import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'scorecardSection',
  title: 'Leadership Scorecard Section',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Section title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'key',
      title: 'Key (slug)',
      type: 'slug',
      options: { maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Display order',
      type: 'number',
      initialValue: 1,
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'questions',
      title: 'Questions',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'text', title: 'Question text', type: 'string', validation: (Rule) => Rule.required() },
            { name: 'order', title: 'Order', type: 'number', initialValue: 1 },
          ],
          preview: {
            select: { title: 'text', subtitle: 'order' },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'order' },
    prepare({ title, subtitle }) {
      return { title: title || 'Section', subtitle: subtitle != null ? `#${subtitle}` : '' };
    },
  },
  orderings: [
    {
      title: 'Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
});
