import Link from 'next/link';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { SEO } from '@components/common/seo';
import { MainHeader } from '@components/home/main-header';
import { MainContainer } from '@components/home/main-container';
import { HeroIcon } from '@components/ui/hero-icon';
import type { ReactElement, ReactNode } from 'react';

const settingsLinks = [
  { href: '/settings/account', title: 'Account', description: 'Manage your account settings', icon: 'UserIcon' },
  { href: '/settings/privacy', title: 'Privacy', description: 'Control your privacy settings', icon: 'LockClosedIcon' },
  { href: '/settings/notifications', title: 'Notifications', description: 'Manage notification preferences', icon: 'BellIcon' }
];

export default function Settings(): React.ReactElement {
  return (
    <MainContainer>
      <SEO title='Settings / Whistlr' />
      <MainHeader title='Settings' />
      <section className='mt-0.5'>
        <div className='divide-y divide-light-border dark:divide-dark-border'>
          {settingsLinks.map(({ href, title, description, icon }) => (
            <Link
              key={href}
              href={href}
              className='flex items-center gap-4 p-4 transition hover:bg-light-primary/5 dark:hover:bg-dark-primary/5'
            >
              <HeroIcon className='h-6 w-6' iconName={icon as any} />
              <div>
                <p className='font-semibold'>{title}</p>
                <p className='text-sm text-light-secondary dark:text-dark-secondary'>{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </MainContainer>
  );
}

Settings.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <HomeLayout>{page}</HomeLayout>
    </MainLayout>
  </ProtectedLayout>
);


