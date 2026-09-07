import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/query';
import { SessionProvider } from './auth/session';
import { router } from './app/router';
import './styles.css';
const root = document.getElementById('root');
if (!root) throw new Error('Root element missing');
createRoot(root).render(
  <QueryClientProvider client={queryClient}>
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>
  </QueryClientProvider>,
);
