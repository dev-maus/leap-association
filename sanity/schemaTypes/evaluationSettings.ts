import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'evaluationSettings',
  title: 'Participant Evaluation Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Internal label',
      type: 'string',
      initialValue: 'Evaluation defaults',
      readOnly: true,
    }),
    defineField({
      name: 'ratingQuestions',
      title: 'Rating questions (Likert)',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'text', title: 'Question text', type: 'text', rows: 2, validation: (Rule) => Rule.required() },
            { name: 'order', title: 'Order', type: 'number', initialValue: 1 },
          ],
          preview: {
            select: { title: 'text', subtitle: 'order' },
          },
        },
      ],
    }),
    defineField({
      name: 'ratingLabels',
      title: 'Rating labels (1–5)',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Exactly five labels for scores 1 through 5.',
      validation: (Rule) =>
        Rule.custom((arr) => {
          if (!arr || arr.length === 0) return true;
          if (arr.length !== 5) return 'Provide exactly 5 labels (one per score).';
          return true;
        }),
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Participant Evaluation Settings' };
    },
  },
});
