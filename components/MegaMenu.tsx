import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCloudinaryUrl } from '../utils/imageUrl';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';

export type MegaMenuItem = {
  title: string;
  href: string;
  icon: string;
  description: string;
  titleFieldPath?: string;
  titleSbFieldPath?: string;
  descriptionFieldPath?: string;
  descriptionSbFieldPath?: string;
};

type MegaMenuProps = {
  items: MegaMenuItem[];
  onClose: () => void;
  labelledBy?: string;
  menuId?: string;
  menuRef?: (node: HTMLDivElement | null) => void;
  sbObjectId?: string;
  onEscape?: () => void;
};

const MegaMenu: React.FC<MegaMenuProps> = ({
  items,
  onClose,
  labelledBy,
  menuId,
  menuRef,
  sbObjectId,
  onEscape,
}) => {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        onEscape?.();
      }
    },
    [onClose, onEscape],
  );

  return (
    <motion.div
      id={menuId}
      role="menu"
      aria-labelledby={labelledBy}
      ref={menuRef}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="pointer-events-auto absolute left-1/2 top-full z-50 mt-6 w-[min(90vw,640px)] -translate-x-1/2 rounded-2xl bg-stone-50 p-6 shadow-xl ring-1 ring-stone-200/60"
      onKeyDown={handleKeyDown}
      data-sb-object-id={sbObjectId}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => {
          const cloudinaryUrl = getCloudinaryUrl(item.icon) ?? item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              role="menuitem"
              className="group flex items-start gap-4 rounded-xl p-4 transition-colors duration-200 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
              onClick={onClose}
            >
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-stone-100 shadow-sm">
                <img
                  src={cloudinaryUrl}
                  alt={item.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex-1">
                <h3
                  className="text-base font-semibold text-stone-900"
                  {...getVisualEditorAttributes(item.titleFieldPath ?? undefined)}
                  data-sb-field-path={item.titleSbFieldPath}
                >
                  {item.title}
                </h3>
                <p
                  className="mt-2 text-sm text-stone-500"
                  {...getVisualEditorAttributes(item.descriptionFieldPath ?? undefined)}
                  data-sb-field-path={item.descriptionSbFieldPath}
                >
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
};

export default MegaMenu;
