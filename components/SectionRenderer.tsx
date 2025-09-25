import React from 'react';
import TimelineSection from './TimelineSection';
import ImageTextHalf from './sections/ImageTextHalf';
import ImageGrid from './sections/ImageGrid';
import VideoGallery from './VideoGallery';
import TrainingList from './TrainingList';
import type { PageSection } from '../types';

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
          default:
            return null;
        }
      })}
    </>
  );
};

export default SectionRenderer;
