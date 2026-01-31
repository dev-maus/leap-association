import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'socialLink',
  title: 'Social Link',
  type: 'object',
  fields: [
    defineField({
      name: 'platform',
      title: 'Platform',
      type: 'string',
      options: {
        list: [
          {title: 'Twitter / X', value: 'twitter'},
          {title: 'LinkedIn', value: 'linkedin'},
          {title: 'Facebook', value: 'facebook'},
          {title: 'Instagram', value: 'instagram'},
          {title: 'YouTube', value: 'youtube'},
          {title: 'Email', value: 'email'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'string',
      description: 'Full URL (e.g., https://twitter.com/leapassociation) or email address for email type',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'label',
      title: 'Accessibility Label',
      type: 'string',
      description: 'Label for screen readers (e.g., "Follow us on Twitter")',
    }),
  ],
  preview: {
    select: {
      platform: 'platform',
      url: 'url',
    },
    prepare({platform, url}) {
      const platformTitles: Record<string, string> = {
        twitter: 'Twitter / X',
        linkedin: 'LinkedIn',
        facebook: 'Facebook',
        instagram: 'Instagram',
        youtube: 'YouTube',
        email: 'Email',
      }
      return {
        title: platformTitles[platform] || platform,
        subtitle: url,
      }
    },
  },
})
