import React from 'react';
import type { FocalPoint } from '../../types';
import { getVisualEditorAttributes } from '../../utils/stackbitBindings';
import { getCloudinaryUrl, getObjectPositionFromFocal } from '../../utils/imageUrl';

interface ImageGridItemProps {
  image?: string;
  title?: string;
  subtitle?: string;
  alt?: string;
  imageFocal?: FocalPoint | null;
}

interface ImageGridProps {
  items: ImageGridItemProps[];
  fieldPath?: string;
}

const ImageGrid: React.FC<ImageGridProps> = ({ items, fieldPath }) => {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <section
      className="py-16 sm:py-24 bg-stone-50"
      data-sb-field-path={fieldPath}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((item, index) => {
            if (!item) {
              return null;
            }

            const itemFieldPath = fieldPath ? `${fieldPath}.items.${index}` : undefined;
            const itemKey = item.image
              ?? item.title
              ?? item.subtitle
              ?? JSON.stringify(item ?? {});
            const imageSrc = item.image?.trim();
            const cloudinaryUrl = imageSrc ? getCloudinaryUrl(imageSrc) ?? imageSrc : '';
            const objectPosition = getObjectPositionFromFocal(item.imageFocal ?? undefined);
            const imageStyle = objectPosition ? { objectPosition } : undefined;
            const altText = [item.alt, item.title, item.subtitle]
              .map((value) => value?.trim())
              .find((value): value is string => Boolean(value))
              ?? 'Gallery image';

            return (
              <div
                key={itemKey ?? `image-grid-item`}
                className="flex flex-col bg-white rounded-lg shadow-sm overflow-hidden"
                {...(itemFieldPath ? getVisualEditorAttributes(itemFieldPath) : {})}
              >
                <div
                  className="w-full aspect-[4/3] bg-stone-100 flex items-center justify-center"
                  {...(itemFieldPath ? getVisualEditorAttributes(`${itemFieldPath}.image`) : {})}
                >
                  {imageSrc ? (
                    <img
                      src={cloudinaryUrl}
                      alt={altText}
                      className="w-full h-full object-cover"
                      style={imageStyle}
                    />
                  ) : (
                    <span className="text-sm text-stone-400">Image coming soon</span>
                  )}
                </div>
                <div className="p-6 flex flex-col gap-2">
                  {item.title?.trim() ? (
                    <h3
                      className="text-lg font-semibold text-stone-900"
                      {...(itemFieldPath ? getVisualEditorAttributes(`${itemFieldPath}.title`) : {})}
                    >
                      {item.title.trim()}
                    </h3>
                  ) : null}
                  {item.subtitle?.trim() ? (
                    <p
                      className="text-sm text-stone-600"
                      {...(itemFieldPath ? getVisualEditorAttributes(`${itemFieldPath}.subtitle`) : {})}
                    >
                      {item.subtitle.trim()}
                    </p>
                  ) : null}
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
