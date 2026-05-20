import React from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from '@heroui/react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import './index.css';
import { routes } from './App';

// Apply language + direction before first render
const lang = localStorage.getItem('leen_lang') || 'ar';
document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = lang;

// Apply saved theme (data-theme attribute drives CSS variable overrides in index.css)
const theme = localStorage.getItem('leen_theme') || 'teal';
document.documentElement.setAttribute('data-theme', theme);

const router = createBrowserRouter(routes, { basename: '/leen-admin/' });

createRoot(document.getElementById('root')).render(
  <I18nProvider locale={lang === 'ar' ? 'ar-EG' : 'en-US'}>
    <RouterProvider router={router} />
  </I18nProvider>
);
