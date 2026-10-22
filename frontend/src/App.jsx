import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { StoreProvider } from './store/StoreContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <AppRoutes />
      </StoreProvider>
    </BrowserRouter>
  );
}
