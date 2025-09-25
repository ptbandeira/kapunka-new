import React from 'react';

interface ImageGridItemProps {
  image?: string;
  title?: string;
  subtitle?: string;
}

interface ImageGridProps {
  items: ImageGridItemProps[];
  fieldPath?: string;
}

const ImageGrid: React.FC<ImageGridProps> = ({ items, fieldPath }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-24 bg-stone-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((item, index) => {
            const itemFieldPath = fieldPath ? `${fieldPath}.items.${index}` : undefined;

            return (
              <div
                key={`image-grid-${index}`}
                className="flex flex-col bg-white rounded-lg shadow-sm overflow-hidden"
                {...(itemFieldPath ? { 'data-nlv-field-path': itemFieldPath } : {})}
              >
                <div
                  className="w-full aspect-[4/3] bg-stone-100 flex items-center justify-center"
                  {...(itemFieldPath ? { 'data-nlv-field-path': `${itemFieldPath}.image` } : {})}
                >
                  {item.image ? (
                    <img src={item.image} alt={item.title ?? ''} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm text-stone-400">Image coming soon</span>
                  )}
                </div>
                <div className="p-6 flex flex-col gap-2">
                  {item.title && (
                    <h3
                      className="text-lg font-semibold text-stone-900"
                      {...(itemFieldPath ? { 'data-nlv-field-path': `${itemFieldPath}.title` } : {})}
                    >
                      {item.title}
                    </h3>
                  )}
                  {item.subtitle && (
                    <p
                      className="text-sm text-stone-600"
                      {...(itemFieldPath ? { 'data-nlv-field-path': `${itemFieldPath}.subtitle` } : {})}
                    >
                      {item.subtitle}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ImageGrid;
