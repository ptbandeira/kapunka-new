import React, { useMemo, useState } from 'react';
import TimelineSection from './TimelineSection';
import ImageTextHalf from './sections/ImageTextHalf';
import ImageGrid from './sections/ImageGrid';
import VideoGallery from './VideoGallery';
import TrainingList from './TrainingList';
import type { PageSection, ProductTabsSectionContent, ProductTab } from '../types';

const ProductTabsSection: React.FC<{ section: ProductTabsSectionContent }> = ({ section }) => {
  const { tabs, initialActiveTab } = section;
  const sanitizedTabs = useMemo(() => tabs.filter((tab): tab is ProductTab => Boolean(tab && tab.id && tab.label)), [tabs]);

  const defaultActive = initialActiveTab && sanitizedTabs.some((tab) => tab.id === initialActiveTab)
    ? initialActiveTab
    : sanitizedTabs[0]?.id;

  const [activeTab, setActiveTab] = useState<string | undefined>(defaultActive);

  if (sanitizedTabs.length === 0 || !activeTab) {
    return null;
  }

  return (
    <div>
      <div className="border-b border-stone-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {sanitizedTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-stone-800 text-stone-900'
                  : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <span data-nlv-field-path={tab.labelFieldPath}>{tab.label}</span>
            </button>
          ))}
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

const SectionRenderer: React.FC<SectionRendererProps> = ({ sections, fieldPath }) => {
  if (!sections || sections.length === 0) {
    return null;
  }

  return (
    <>
      {sections.map((section, index) => {
        const sectionFieldPath = fieldPath ? `${fieldPath}.${index}` : undefined;

        switch (section.type) {
          case 'timeline':
            return (
              <TimelineSection
                key={`timeline-${index}`}
                title={section.title}
                entries={section.entries}
                fieldPath={sectionFieldPath}
              />
            );
          case 'imageTextHalf':
            return (
              <ImageTextHalf
                key={`image-text-half-${index}`}
                image={section.image}
                title={section.title}
                text={section.text}
                fieldPath={sectionFieldPath}
              />
            );
          case 'imageGrid':
            return (
              <ImageGrid
                key={`image-grid-${index}`}
                items={section.items}
                fieldPath={sectionFieldPath}
              />
            );
          case 'videoGallery':
            return (
              <VideoGallery
                key={`video-gallery-${index}`}
                title={section.title}
                description={section.description}
                entries={section.entries}
                fieldPath={sectionFieldPath}
              />
            );
          case 'trainingList':
            return (
              <TrainingList
                key={`training-list-${index}`}
                title={section.title}
                description={section.description}
                entries={section.entries}
                fieldPath={sectionFieldPath}
              />
            );
          case 'productTabs':
            return (
              <ProductTabsSection
                key={`product-tabs-${index}`}
                section={section}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
};

export default SectionRenderer;
