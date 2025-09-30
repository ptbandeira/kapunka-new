import 'framer-motion';

declare module 'framer-motion' {
  interface MotionProps {
    className?: string;
    onClick?: ((event: unknown) => void) | undefined;
  }
}
