import React from 'react';
import { Route } from 'react-router-dom';
import ProjectDetails from './components/ProjectDetails';

const App: React.FC = () => {
  return (
    <Route path="/projects/:projectId" component={ProjectDetails} />
  );
};

export default App; 