import React from 'react';
import ErrorPage from '../components/ErrorPage';

const Unauthorized = () => {
  return <ErrorPage errorCode={401} />;
};

export default Unauthorized;