import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'practiceResource',
  title: 'Practice Resource',
  type: 'document',
  fields: [
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Order in which to display (lower numbers first)',
      validation: (Rule) => Rule.required().integer().min(0),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Resource title, e.g., "Individual HATS™ Guide"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Resource Type',
      type: 'string',
      description: 'Type of resource',
      options: {
        list: [
          {title: 'PDF Guide', value: 'PDF Guide'},
          {title: 'Workbook', value: 'Workbook'},
          {title: 'Infographic', value: 'Infographic'},
          {title: 'Checklist', value: 'Checklist'},
          {title: 'Template', value: 'Template'},
          {title: 'Video', value: 'Video'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Brief description of what this resource contains',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'icon',
      title: 'Icon SVG Path',
      type: 'string',
      description: 'SVG path data for the resource icon (d attribute)',
    }),
    defineField({
      name: 'file',
      title: 'Download File',
      type: 'file',
      description: 'The downloadable file',
      options: {
        accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip',
      },
    }),
    defineField({
      name: 'downloadUrl',
      title: 'External Download URL',
      type: 'url',
      description: 'Alternative: link to external download (if not using file upload)',
    }),
    defineField({
      name: 'requiresEmail',
      title: 'Requires Email',
      type: 'boolean',
      description: 'Whether to require email before download',
      initialValue: false,
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Published', value: 'published'},
          {title: 'Draft', value: 'draft'},
          {title: 'Archived', value: 'archived'},
        ],
      },
      initialValue: 'draft',
    }),
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
    {
      title: 'Title',
      name: 'titleAsc',
      by: [{field: 'title', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      type: 'type',
      status: 'status',
    },
    prepare({title, type, status}) {
      return {
        title: title || 'Untitled Resource',
        subtitle: `${type || 'Unknown type'} - ${status || 'draft'}`,
      }
    },
  },
})
