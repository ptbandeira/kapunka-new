// User-friendly section configurations
export const userFriendlySections = {
  mediaShowcase: {
    label: 'Media Showcase',
    name: 'mediaShowcase',
    widget: 'object',
    collapsed: true,
    summary: '{{fields.contentSettings.title | default("Untitled")}}',
    fields: [
      {
        name: 'type',
        widget: 'hidden',
        default: 'mediaShowcase'
      },
      {
        label: 'Content Settings',
        name: 'contentSettings',
        widget: 'object',
        collapsed: false,
        fields: [
          {
            label: 'Section Title',
            name: 'title',
            widget: 'string',
            required: false,
            hint: 'The main heading for this showcase section'
          },
          {
            label: 'Cards',
            name: 'items',
            widget: 'list',
            collapsed: false,
            summary: '{{fields.content.title | default("Card")}} · {{fields.visual.layout | default("Default")}}',
            fields: [
              {
                label: 'Content',
                name: 'content',
                widget: 'object',
                collapsed: false,
                fields: [
                  {
                    label: 'Eyebrow Text',
                    name: 'eyebrow',
                    widget: 'string',
                    required: false,
                    hint: 'Short text displayed above the title'
                  },
                  {
                    label: 'Card Title',
                    name: 'title',
                    widget: 'string',
                    required: false,
                    hint: 'Main heading for this card'
                  },
                  {
                    label: 'Description',
                    name: 'body',
                    widget: 'text',
                    required: false,
                    hint: 'Main text content for the card'
                  }
                ]
              },
              {
                label: 'Visual Settings',
                name: 'visual',
                widget: 'object',
                collapsed: false,
                fields: [
                  {
                    label: 'Image',
                    name: 'image',
                    widget: 'image',
                    choose_url: true,
                    required: false,
                    hint: 'Select or upload an image for this card',
                    preview_size: 'medium'
                  },
                  {
                    label: 'Layout',
                    name: 'layout',
                    widget: 'select',
                    options: [
                      { label: 'Full Width', value: 'full' },
                      { label: 'Half Width', value: 'half' },
                      { label: 'Compact', value: 'compact' }
                    ],
                    default: 'full',
                    hint: 'Choose how this card should be displayed'
                  },
                  {
                    label: 'Text Position',
                    name: 'textPosition',
                    widget: 'select',
                    options: [
                      { label: 'Bottom Left', value: 'bottom-left' },
                      { label: 'Bottom Center', value: 'bottom-center' },
                      { label: 'Bottom Right', value: 'bottom-right' },
                      { label: 'Center', value: 'center' }
                    ],
                    default: 'bottom-left',
                    hint: 'Where should the text appear on the image?'
                  },
                  {
                    label: 'Image Focus',
                    name: 'imageFocal',
                    widget: 'object',
                    collapsed: true,
                    fields: [
                      {
                        label: 'Horizontal (0–1)',
                        name: 'x',
                        widget: 'number',
                        value_type: 'float',
                        min: 0,
                        max: 1,
                        step: 0.1,
                        required: false
                      },
                      {
                        label: 'Vertical (0–1)',
                        name: 'y',
                        widget: 'number',
                        value_type: 'float',
                        min: 0,
                        max: 1,
                        step: 0.1,
                        required: false
                      }
                    ],
                    required: false,
                    hint: 'Fine-tune which part of the image remains visible'
                  }
                ]
              },
              {
                label: 'Button',
                name: 'cta',
                widget: 'object',
                collapsed: false,
                fields: [
                  {
                    label: 'Button Text',
                    name: 'ctaLabel',
                    widget: 'string',
                    required: false,
                    hint: 'Text to display on the button'
                  },
                  {
                    label: 'Link',
                    name: 'ctaHref',
                    widget: 'string',
                    required: false,
                    hint: 'Where should this button link to?'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        label: 'Advanced Settings',
        name: 'advancedSettings',
        widget: 'object',
        collapsed: true,
        fields: [
          {
            label: 'Section ID',
            name: 'sectionId',
            widget: 'string',
            required: false,
            hint: 'Optional HTML ID for this section'
          },
          {
            label: 'Custom Classes',
            name: 'customClasses',
            widget: 'string',
            required: false,
            hint: 'Additional CSS classes to apply'
          },
          {
            label: 'Animation',
            name: 'animation',
            widget: 'select',
            options: [
              { label: 'None', value: 'none' },
              { label: 'Fade In', value: 'fade' },
              { label: 'Slide Up', value: 'slide-up' }
            ],
            default: 'none',
            required: false
          }
        ]
      }
    ]
  }
};
