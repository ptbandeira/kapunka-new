import React from 'react';

const MediaShowcasePreview = ({ entry, getAsset }) => {
  const data = entry.getIn(['data']);
  const isSection = data.get('type') === 'mediaShowcase';
  
  // If this is a page preview, find the MediaShowcase section
  const section = isSection ? data : data
    .get('sections')
    ?.find(section => section.get('type') === 'mediaShowcase');
  
  if (!section) return null;

  const getContent = () => {
    const items = section.getIn(['contentSettings', 'items']) || [];
    const title = section.getIn(['contentSettings', 'title']);

    return (
      <div className="preview-media-showcase">
        <div className="preview-section-header">
          {title && <h2 className="preview-section-title">{title}</h2>}
        </div>

        <div className="preview-media-grid">
          {items.map((item, index) => {
            const content = item.get('content') || {};
            const visual = item.get('visual') || {};
            const cta = item.get('cta') || {};
            
            const imageSrc = visual.get('image') 
              ? getAsset(visual.get('image'))?.toString() 
              : null;
              
            const focalPoint = {
              x: visual.getIn(['imageFocal', 'x']) || 0.5,
              y: visual.getIn(['imageFocal', 'y']) || 0.5,
            };
            
            const cardStyle = {
              backgroundImage: imageSrc ? `url(${imageSrc})` : undefined,
              backgroundPosition: `${focalPoint.x * 100}% ${focalPoint.y * 100}%`,
            };

            const layout = visual.get('layout') || 'full';
            const position = visual.get('textPosition') || 'bottom-left';

            return (
              <div 
                key={index}
                className={`preview-media-card layout-${layout}`}
                style={cardStyle}
              >
                <div className="preview-card-overlay" />
                <div className={`preview-card-content position-${position}`}>
                  {content.get('eyebrow') && (
                    <div className="preview-card-eyebrow">
                      {content.get('eyebrow')}
                    </div>
                  )}
                  
                  {content.get('title') && (
                    <h3 className="preview-card-title">
                      {content.get('title')}
                    </h3>
                  )}
                  
                  {content.get('body') && (
                    <p className="preview-card-body">
                      {content.get('body')}
                    </p>
                  )}
                  
                  {cta.get('ctaLabel') && (
                    <button className="preview-card-cta">
                      {cta.get('ctaLabel')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return getContent();
};

export default MediaShowcasePreview;
