import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { StoreProvider } from './store/StoreContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <StoreProvider>
        <AppRoutes />
      </StoreProvider>
    </BrowserRouter>
  );
}
