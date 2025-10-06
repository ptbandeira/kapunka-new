import React, { useCallback, useMemo, useState } from 'react';
import TimelineSection from './TimelineSection';
import ImageTextHalf from './sections/ImageTextHalf';
import ImageGrid from './sections/ImageGrid';
import VideoGallery from './VideoGallery';
import TrainingList from './TrainingList';
import CommunityCarousel from './sections/CommunityCarousel';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';
import type { PageSection, ProductTab, ProductTabsSectionContent } from '../types';
import { filterVisible } from '../utils/contentVisibility';

const ProductTabsSection: React.FC<{ section: ProductTabsSectionContent }> = ({ section }) => {
  const { tabs, initialActiveTab } = section;
  const sanitizedTabs = useMemo(() => {
    if (!Array.isArray(tabs) || tabs.length === 0) {
      return [] as ProductTab[];
    }

    return tabs.filter((tab): tab is ProductTab => {
      if (!tab?.id) {
        return false;
      }

      const label = tab.label?.trim();
      return Boolean(label);
    });
  }, [tabs]);

  const defaultActive =
    initialActiveTab && sanitizedTabs.some((tab) => tab.id === initialActiveTab)
      ? initialActiveTab
      : sanitizedTabs[0]?.id;

  const [activeTab, setActiveTab] = useState<string | undefined>(defaultActive);

  const handleTabClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const { tabId } = event.currentTarget.dataset;
    if (tabId) {
      setActiveTab(tabId);
    }
  }, []);

  if (sanitizedTabs.length === 0 || !activeTab) {
    return null;
  }

  return (
    <div>
      <div className="border-b border-stone-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {sanitizedTabs.map((tab) => {
            const label = tab.label?.trim();
            if (!label) {
              return null;
            }

            return (
              <button
                key={tab.id}
                onClick={handleTabClick}
              className={`${
                activeTab === tab.id
                  ? 'border-stone-800 text-stone-900'
                  : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              data-tab-id={tab.id}
            >
              <span {...getVisualEditorAttributes(tab.labelFieldPath)}>{label}</span>
            </button>
            );
          })}
        </nav>
      </div>
      <div className="mt-6 prose prose-stone max-w-none text-stone-700">
        {sanitizedTabs.map((tab) => {
          if (tab.id !== activeTab) {
            return null;
          }

          const content = typeof tab.content === 'function' ? tab.content() : tab.content;

          return (
            <div key={tab.id} className="space-y-4">
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface SectionRendererProps {
  sections: PageSection[];
  fieldPath?: string;
}

const buildSectionKey = (prefix: string, section: PageSection): string => {
  try {
    const serialized = JSON.stringify(section);
    if (serialized && serialized !== '{}') {
      return `${prefix}-${serialized}`;
    }
  } catch (error) {
    // no-op: fall through to prefix fallback
  }

  if ('title' in section && typeof section.title === 'string' && section.title.trim().length > 0) {
    return `${prefix}-${section.title}`;
  }

  return prefix;
};

const SectionRenderer: React.FC<SectionRendererProps> = ({ sections, fieldPath }) => {
  const safeSections = filterVisible(sections);

  if (safeSections.length === 0) {
    return null;
  }

  return (
    <>
      {safeSections.map((section, index) => {
        const sectionFieldPath = fieldPath ? `${fieldPath}.${index}` : undefined;

        switch (section.type) {
          case 'timeline':
            return (
              <TimelineSection
                key={buildSectionKey('timeline', section)}
                title={section.title}
                entries={section.entries}
                fieldPath={sectionFieldPath}
              />
            );
          case 'imageTextHalf':
            return (
              <ImageTextHalf
                key={buildSectionKey('image-text-half', section)}
                image={section.image}
                title={section.title}
                text={section.text}
                imageAlt={section.imageAlt}
                fieldPath={sectionFieldPath}
              />
            );
          case 'imageGrid':
            return (
              <ImageGrid
                key={buildSectionKey('image-grid', section)}
                items={section.items}
                fieldPath={sectionFieldPath}
              />
            );
          case 'videoGallery':
            return (
              <VideoGallery
                key={buildSectionKey('video-gallery', section)}
                title={section.title}
                description={section.description}
                entries={section.entries}
                fieldPath={sectionFieldPath}
              />
            );
          case 'trainingList':
            return (
              <TrainingList
                key={buildSectionKey('training-list', section)}
                title={section.title}
                description={section.description}
                entries={section.entries}
                fieldPath={sectionFieldPath}
              />
            );
          case 'productTabs':
            return (
              <ProductTabsSection
                key={buildSectionKey('product-tabs', section)}
                section={section}
              />
            );
          case 'communityCarousel': {
            const slidesSource = Array.isArray(section.slides) ? section.slides : [];
            if (slidesSource.length === 0 && !section.title?.trim()) {
              return null;
            }

            const slides = slidesSource.map((slide, slideIndex) => {
              const baseFieldPath = sectionFieldPath ? `${sectionFieldPath}.slides.${slideIndex}` : undefined;

              return {
                image: slide.image,
                alt: slide.alt,
                quote: slide.quote,
                name: slide.name,
                role: slide.role,
                fieldPath: baseFieldPath,
                imageFieldPath: baseFieldPath ? `${baseFieldPath}.image` : undefined,
                altFieldPath: baseFieldPath ? `${baseFieldPath}.alt` : undefined,
                quoteFieldPath: baseFieldPath ? `${baseFieldPath}.quote` : undefined,
                nameFieldPath: baseFieldPath ? `${baseFieldPath}.name` : undefined,
                roleFieldPath: baseFieldPath ? `${baseFieldPath}.role` : undefined,
              };
            });

            return (
              <CommunityCarousel
                key={buildSectionKey('community-carousel', section)}
                title={section.title}
                slides={slides}
                fieldPath={sectionFieldPath}
                slidesFieldPath={sectionFieldPath ? `${sectionFieldPath}.slides` : undefined}
                slideDuration={section.slideDuration}
                quoteDuration={section.quoteDuration}
              />
            );
          }
          default:
            return null;
        }
      })}
    </>
  );
};

export default SectionRenderer;
