import '@styles/globals.scss';
import '@styles/animations.css';

import { useEffect } from 'react';
import { AuthContextProvider } from '@lib/context/auth-context';
import { ThemeContextProvider } from '@lib/context/theme-context';
import { AppHead } from '@components/common/app-head';
import type { ReactElement, ReactNode } from 'react';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

export default function App({
  Component,
  pageProps
}: AppPropsWithLayout): ReactNode {
  const getLayout = Component.getLayout ?? ((page): ReactNode => page);

  // Suppress auth-related errors from showing in dev overlay
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('Invalid login credentials') ||
          event.error?.message?.includes('AuthApiError') ||
          event.error?.message?.includes('Email not confirmed')) {
        event.preventDefault();
        event.stopPropagation();
        console.log('🔒 [Auth Error Suppressed]:', event.error.message);
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('Invalid login credentials') ||
          event.reason?.message?.includes('AuthApiError') ||
          event.reason?.message?.includes('Email not confirmed')) {
        event.preventDefault();
        event.stopPropagation();
        console.log('🔒 [Promise Rejection Suppressed]:', event.reason.message);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return (
    <>
      <AppHead />
      <AuthContextProvider>
        <ThemeContextProvider>
          {getLayout(<Component {...pageProps} />)}
        </ThemeContextProvider>
      </AuthContextProvider>
    </>
  );
}
