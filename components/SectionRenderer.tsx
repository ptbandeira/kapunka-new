import React from 'react';
import TimelineSection from './TimelineSection';
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
        if (section.type === 'timeline') {
          return (
            <TimelineSection
              key={`timeline-${index}`}
              title={section.title}
              entries={section.entries}
              fieldPath={fieldPath ? `${fieldPath}.${index}` : undefined}
            />
          );
        }

        return null;
      })}
    </>
  );
};

export default SectionRenderer;
