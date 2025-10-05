import React from 'react';
import { motion } from 'framer-motion';

import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

const EASING: [number, number, number, number] = [0.21, 0.75, 0.31, 0.96];

const containerVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
} as const;

type ElementTag = keyof JSX.IntrinsicElements;

interface SectionContextValue {
  prefersReducedMotion: boolean;
}

const SectionContext = React.createContext<SectionContextValue>({ prefersReducedMotion: false });

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  as?: ElementTag;
  staggerChildren?: number;
  delayChildren?: number;
  viewportAmount?: number;
}

interface SectionItemProps extends React.HTMLAttributes<HTMLElement> {
  as?: ElementTag;
  delay?: number;
}

type SectionItemComponent = React.ForwardRefExoticComponent<SectionItemProps & React.RefAttributes<HTMLElement>> & {
  __sectionItem: true;
};

const SectionItem = React.forwardRef<HTMLElement, SectionItemProps>(({
  as: Component = 'div',
  className,
  children,
  delay,
  ...rest
}, ref) => {
  const { prefersReducedMotion } = React.useContext(SectionContext);
  const Element = Component as React.ElementType;

  if (prefersReducedMotion) {
    return (
      <Element ref={ref as React.Ref<any>} className={className} {...rest}>
        {children}
      </Element>
    );
  }

  const MotionElement = motion(Element);

  return (
    <MotionElement
      ref={ref as React.Ref<any>}
      className={className}
      variants={itemVariants}
      transition={{
        duration: 0.55,
        ease: EASING,
        delay,
      }}
      {...rest}
    >
      {children}
    </MotionElement>
  );
}) as SectionItemComponent;

SectionItem.__sectionItem = true;

const SectionRoot = React.forwardRef<HTMLElement, SectionProps>(({
  as: Component = 'section',
  className,
  children,
  staggerChildren = 0.14,
  delayChildren = 0.08,
  viewportAmount = 0.2,
  ...rest
}, ref) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const Element = Component as React.ElementType;
  const childCount = React.Children.count(children);

  const animatedChildren = prefersReducedMotion
    ? React.Children.toArray(children)
    : React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) {
          return (
            <SectionItem key={`section-item-${index}`}>
              {child}
            </SectionItem>
          );
        }

        const isSectionItem = (child.type as SectionItemComponent | undefined)?.__sectionItem === true;
        if (isSectionItem) {
          return child;
        }

        const key = child.key ?? `section-item-${index}`;

        return (
          <SectionItem key={key}>
            {child}
          </SectionItem>
        );
      });

  if (prefersReducedMotion) {
    return (
      <SectionContext.Provider value={{ prefersReducedMotion }}>
        <Element ref={ref as React.Ref<any>} className={className} {...rest}>
          {animatedChildren}
        </Element>
      </SectionContext.Provider>
    );
  }

  const MotionComponent = motion(Element);

  return (
    <SectionContext.Provider value={{ prefersReducedMotion }}>
      <MotionComponent
        ref={ref as React.Ref<any>}
        className={className}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: viewportAmount }}
        variants={containerVariants}
        transition={{
          duration: 0.6,
          ease: EASING,
          staggerChildren: childCount > 1 ? staggerChildren : undefined,
          delayChildren: childCount > 1 ? delayChildren : undefined,
        }}
        {...rest}
      >
        {animatedChildren}
      </MotionComponent>
    </SectionContext.Provider>
  );
});

SectionRoot.displayName = 'Section';

const Section = Object.assign(SectionRoot, { Item: SectionItem });

export type { SectionProps, SectionItemProps };
export { SectionItem };
export default Section;
