import Link from 'next/link';
import { useAuth } from '@lib/context/auth-context';
import { useWindow } from '@lib/context/window-context';
import { useModal } from '@lib/hooks/useModal';
import { Modal } from '@components/modal/modal';
import { Input } from '@components/input/input';
import { CustomIcon } from '@components/ui/custom-icon';
import { Button } from '@components/ui/button';
import { SidebarLink } from './sidebar-link';
import { MoreSettings } from './more-settings';
import { SidebarProfile } from './sidebar-profile';
import type { IconName } from '@components/ui/hero-icon';

export type NavLink = {
  href: string;
  linkName: string;
  iconName: IconName;
  disabled?: boolean;
  canBeHidden?: boolean;
};

const navLinks: Readonly<NavLink[]> = [
  {
    href: '/home',
    linkName: 'Home',
    iconName: 'HomeIcon'
  },
  {
    href: '/minis',
    linkName: 'Minis',
    iconName: 'FilmIcon'
  },
  {
    href: '/inbox',
    linkName: 'Inbox',
    iconName: 'EnvelopeIcon'
  },
  {
    href: '/notifications',
    linkName: 'Notifications',
    iconName: 'BellIcon'
  },
  {
    href: '/discover',
    linkName: 'Discover',
    iconName: 'MagnifyingGlassIcon'
  },
  {
    href: '/waves',
    linkName: 'Waves',
    iconName: 'MusicalNoteIcon',
    canBeHidden: true
  },
  {
    href: '/flow',
    linkName: 'Flow',
    iconName: 'VideoCameraIcon',
    canBeHidden: true
  },
  {
    href: '/noise',
    linkName: 'Noise',
    iconName: 'SpeakerWaveIcon',
    canBeHidden: true
  },
  {
    href: '/news',
    linkName: 'News',
    iconName: 'NewspaperIcon',
    canBeHidden: true
  },
  {
    href: '/market',
    linkName: 'Market',
    iconName: 'ShoppingCartIcon',
    canBeHidden: true
  },
  {
    href: '/bookmarks',
    linkName: 'Bookmarks',
    iconName: 'BookmarkIcon',
    canBeHidden: true
  }
];

export function Sidebar(): JSX.Element {
  const { user } = useAuth();
  const { isMobile } = useWindow();

  const { open, openModal, closeModal } = useModal();

  const username = user?.username as string;

  return (
    <header
      id='sidebar'
      className='flex w-0 shrink-0 transition-opacity duration-200 xs:w-20 md:w-24
                 lg:max-w-none xl:-mr-4 xl:w-full xl:max-w-xs xl:justify-end'
    >
      <Modal
        className='flex items-start justify-center'
        modalClassName='bg-main-background rounded-2xl max-w-xl w-full mt-8 overflow-hidden'
        open={open}
        closeModal={closeModal}
      >
        <Input modal closeModal={closeModal} />
      </Modal>
      <div
        className='fixed bottom-0 z-10 flex w-full flex-col justify-between border-t border-light-border 
                   bg-main-sidebar-background/80 backdrop-blur-md py-0 dark:border-dark-border xs:top-0 xs:h-full xs:w-auto xs:border-0 
                   xs:bg-main-sidebar-background/60 xs:backdrop-blur-lg xs:px-3 xs:py-6 md:px-4 xl:w-72'
      >
        <section className='flex flex-col gap-1 xs:items-start xl:items-stretch'>
          {/* Logo */}
          <h1 className='hidden xs:flex xs:mb-6'>
            <Link
              href='/home'
              className='custom-button main-tab flex h-16 w-16 items-center justify-center rounded-xl text-accent-blue 
                         transition hover:bg-light-primary/10 focus-visible:bg-accent-blue/10 
                         focus-visible:!ring-accent-blue/80 dark:text-whistlr-icon dark:hover:bg-dark-primary/10'
            >
              <CustomIcon className='h-20 w-20' iconName='WhistlrIcon' />
            </Link>
          </h1>
          
          {/* Navigation Links */}
          <nav className='flex flex-col gap-1 xs:w-full'>
            {navLinks.map(({ ...linkData }) => (
              <SidebarLink {...linkData} key={linkData.href} />
            ))}
            <SidebarLink
              href={`/user/${username}`}
              username={username}
              linkName='Profile'
              iconName='UserIcon'
            />
            {!isMobile && <MoreSettings />}
          </nav>
          
          {/* Tweet Button */}
          <Button
            className='accent-tab mt-4 hidden bg-main-accent text-lg font-bold text-white
                       outline-none transition hover:brightness-90 active:brightness-75 
                       xs:flex xs:h-12 xs:w-12 xs:items-center xs:justify-center xs:rounded-xl
                       xl:w-full xl:rounded-full xl:py-3'
            onClick={openModal}
          >
            <CustomIcon
              className='block h-6 w-6 xl:hidden'
              iconName='FeatherIcon'
            />
            <p className='hidden xl:block'>Tweet</p>
          </Button>
        </section>
        
        {/* Profile at bottom - desktop only */}
        {!isMobile && <SidebarProfile />}
      </div>
    </header>
  );
}
