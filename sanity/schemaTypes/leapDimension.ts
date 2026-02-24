import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'leapDimension',
  title: 'LEAP Dimension Page',
  type: 'document',
  fields: [
    defineField({
      name: 'slug',
      title: 'Dimension',
      type: 'string',
      options: {
        list: [
          { title: 'Leadership', value: 'leadership' },
          { title: 'Effectiveness', value: 'effectiveness' },
          { title: 'Accountability', value: 'accountability' },
          { title: 'Productivity', value: 'productivity' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'letter',
      title: 'LEAP Letter',
      type: 'string',
      description: 'L, E, A, or P',
      options: { list: ['L', 'E', 'A', 'P'] },
    }),
    defineField({
      name: 'heroHeading',
      title: 'Hero Heading',
      type: 'string',
    }),
    defineField({
      name: 'heroParagraphs',
      title: 'Hero Paragraphs',
      type: 'array',
      of: [{ type: 'text' }],
    }),
    defineField({
      name: 'definitionHeading',
      title: 'Definition Section Heading',
      type: 'string',
    }),
    defineField({
      name: 'definitionIntro',
      title: 'Definition Intro',
      type: 'text',
    }),
    defineField({
      name: 'definitionItems',
      title: 'Definition Items (e.g. Direction, People, Work)',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'definitionClosing',
      title: 'Definition Closing',
      type: 'text',
    }),
    defineField({
      name: 'definitionSidebarHeading',
      title: 'Definition Sidebar Heading',
      type: 'string',
    }),
    defineField({
      name: 'definitionSidebarText',
      title: 'Definition Sidebar Text',
      type: 'text',
    }),
    defineField({
      name: 'areas',
      title: 'Four Areas Cards',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'dimensionArea',
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'subtitle', title: 'Subtitle', type: 'string' }),
            defineField({
              name: 'bullets',
              title: 'Bullet Points',
              type: 'array',
              of: [{ type: 'string' }],
            }),
            defineField({ name: 'question', title: 'Italic Question', type: 'string' }),
            defineField({
              name: 'color',
              title: 'Color Classes',
              type: 'string',
              description: 'e.g. from-blue-400 to-blue-500',
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'whyItMattersHeading',
      title: 'Why It Matters Heading',
      type: 'string',
    }),
    defineField({
      name: 'whyWithoutList',
      title: 'Without [Dimension] (list items)',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'whyWithList',
      title: 'With [Dimension] (list items)',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'ourBeliefHeading',
      title: 'Our Belief Heading',
      type: 'string',
    }),
    defineField({
      name: 'ourBeliefParagraphs',
      title: 'Our Belief Paragraphs',
      type: 'array',
      of: [{ type: 'text' }],
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
    select: { slug: 'slug', letter: 'letter' },
    prepare({ slug, letter }) {
      return {
        title: (slug as string) ? String(slug).charAt(0).toUpperCase() + (slug as string).slice(1) : 'LEAP Dimension',
        subtitle: letter ? `Letter: ${letter}` : undefined,
      }
    },
  },
})
