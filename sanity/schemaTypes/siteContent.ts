import {defineType, defineField} from 'sanity'

/**
 * Key-value content for page sections (hero, CTA, etc.).
 * Not yet queried from the Astro frontend; wire by page + key when migrating hero/CTA copy to CMS.
 */
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

