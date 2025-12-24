export default {
  name: 'leapFramework',
  title: 'LEAP Framework',
  type: 'document',
  fields: [
    {
      name: 'letter',
      title: 'Letter',
      type: 'string',
      options: {
        list: ['L', 'E', 'A', 'P'],
      },
    },
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
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'color',
      title: 'Color',
      type: 'string',
    },
  ],
};

