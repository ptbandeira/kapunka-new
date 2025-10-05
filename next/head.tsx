import React from 'react';
import { Helmet } from 'react-helmet-async';

interface HeadProps {
  children?: React.ReactNode;
}

const Head: React.FC<HeadProps> = ({ children }) => {
  return <Helmet>{children}</Helmet>;
};

export default Head;
export { Head };
