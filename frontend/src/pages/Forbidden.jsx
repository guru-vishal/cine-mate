import React from 'react';
import ErrorPage from '../components/ErrorPage';

const Forbidden = () => {
  return <ErrorPage errorCode={403} />;
};

export default Forbidden;