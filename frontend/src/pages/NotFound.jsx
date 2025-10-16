import React from 'react';
import ErrorPage from '../components/ErrorPage';

const NotFound = () => {
  return <ErrorPage errorCode={404} />;
};

export default NotFound;