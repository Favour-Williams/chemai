import React from 'react';
import { Routes, Route, useSearchParams } from 'react-router-dom';
import ReactionInput from '../components/reaction/ReactionInput';

const ReactionBuilder: React.FC = () => {
  const [searchParams] = useSearchParams();
  const selectedElements = searchParams.get('elements')?.split(',') || [];

  return (
    <Routes>
      <Route 
        path="/*" 
        element={<ReactionInput initialElements={selectedElements} />} 
      />
    </Routes>
  );
};

export default ReactionBuilder;