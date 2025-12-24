export default {
  name: 'book',
  title: 'Book',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
    },
    {
      name: 'coverUrl',
      title: 'Cover URL',
      type: 'url',
    },
    {
      name: 'price',
      title: 'Price',
      type: 'string',
    },
    {
      name: 'purchaseLink',
      title: 'Purchase Link',
      type: 'url',
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

