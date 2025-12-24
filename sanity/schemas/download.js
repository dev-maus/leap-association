export default {
  name: 'download',
  title: 'Download',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
    },
    {
      name: 'file',
      title: 'File',
      type: 'file',
    },
    {
      name: 'type',
      title: 'Type',
      type: 'string',
    },
    {
      name: 'fileSize',
      title: 'File Size',
      type: 'string',
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: ['draft', 'published'],
      },
    },
  ],
};

