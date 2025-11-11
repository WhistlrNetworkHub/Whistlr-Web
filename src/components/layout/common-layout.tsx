import { useRequireAuth } from '@lib/hooks/useRequireAuth';
import { Aside } from '@components/aside/aside';
import { AsideTrends } from '@components/aside/aside-trends';
import { Suggestions } from '@components/aside/suggestions';
import { Placeholder } from '@components/common/placeholder';
import type { ReactNode } from 'react';

export type LayoutProps = {
  children: ReactNode;
};

export function ProtectedLayout({ children }: LayoutProps): React.ReactElement {
  const user = useRequireAuth();

  if (!user) return <Placeholder />;

  return <>{children}</>;
}

export function HomeLayout({ children }: LayoutProps): React.ReactElement {
  return (
    <>
      {children}
      <Aside>
        <AsideTrends />
        <Suggestions />
      </Aside>
    </>
  );
}

export function UserLayout({ children }: LayoutProps): React.ReactElement {
  return (
    <>
      {children}
      <Aside>
        <Suggestions />
        <AsideTrends />
      </Aside>
    </>
  );
}

export function TrendsLayout({ children }: LayoutProps): React.ReactElement {
  return (
    <>
      {children}
      <Aside>
        <Suggestions />
      </Aside>
    </>
  );
}

export function PeopleLayout({ children }: LayoutProps): React.ReactElement {
  return (
    <>
      {children}
      <Aside>
        <AsideTrends />
      </Aside>
    </>
  );
}
