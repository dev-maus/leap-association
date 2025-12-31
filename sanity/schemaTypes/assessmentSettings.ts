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
    defineField({
      name: 'captchaEnabled',
      title: 'Enable Captcha',
      type: 'boolean',
      description: 'Enable hCaptcha protection for assessment submissions',
      initialValue: false,
    }),
    defineField({
      name: 'hcaptchaSiteKey',
      title: 'hCaptcha Site Key',
      type: 'string',
      description: 'Your hCaptcha site key (get it from https://www.hcaptcha.com/)',
      hidden: ({parent}) => !parent?.captchaEnabled,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {captchaEnabled?: boolean}
          if (parent?.captchaEnabled && !value) {
            return 'Site key is required when captcha is enabled'
          }
          return true
        }),
    }),
    defineField({
      name: 'hcaptchaSecretKey',
      title: 'hCaptcha Secret Key (Reference)',
      type: 'string',
      description:
        'Note: Store the actual secret key in Supabase secrets using: supabase secrets set HCAPTCHA_SECRET_KEY=your-secret-key. This field is for reference only.',
      hidden: ({parent}) => !parent?.captchaEnabled,
    }),
    defineField({
      name: 'scheduling',
      title: 'Scheduling Configuration',
      type: 'object',
      description: 'Configure scheduling links for different assessment types',
      fields: [
        defineField({
          name: 'individualScheduling',
          title: 'Individual Assessment Scheduling',
          type: 'object',
          fields: [
            defineField({
              name: 'buttonText',
              title: 'Button Text',
              type: 'string',
              initialValue: 'Schedule Coaching Session',
            }),
            defineField({
              name: 'url',
              title: 'Scheduling URL',
              type: 'url',
              description: 'External scheduling link (e.g., Calendly, Cal.com)',
              validation: (Rule) => Rule.uri({scheme: ['http', 'https']}),
            }),
          ],
        }),
        defineField({
          name: 'teamScheduling',
          title: 'Team Assessment Scheduling',
          type: 'object',
          fields: [
            defineField({
              name: 'buttonText',
              title: 'Button Text',
              type: 'string',
              initialValue: 'Schedule Team Debrief',
            }),
            defineField({
              name: 'url',
              title: 'Scheduling URL',
              type: 'url',
              description: 'External scheduling link (e.g., Calendly, Cal.com)',
              validation: (Rule) => Rule.uri({scheme: ['http', 'https']}),
            }),
          ],
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

