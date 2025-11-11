import { useRouter } from 'next/router';
import Link from 'next/link';
import cn from 'clsx';
import { preventBubbling } from '@lib/utils';
import { HeroIcon } from '@components/ui/hero-icon';
import type { NavLink } from './sidebar';

type SidebarLinkProps = NavLink & {
  username?: string;
};

export function SidebarLink({
  href,
  username,
  iconName,
  linkName,
  disabled,
  canBeHidden
}: SidebarLinkProps): React.ReactElement {
  const { asPath } = useRouter();
  const isActive = username ? asPath.includes(username) : asPath === href;

  return (
    <Link 
      href={href}
      className={cn(
        'group outline-none',
        canBeHidden ? 'hidden xs:flex' : 'flex',
        disabled && 'cursor-not-allowed'
      )}
      onClick={disabled ? preventBubbling() : undefined}
    >
      <div
        className={cn(
          `custom-button flex items-center gap-4 rounded-xl transition 
           duration-200 group-hover:bg-light-primary/10 group-focus-visible:ring-2 
           group-focus-visible:ring-[#878a8c] dark:group-hover:bg-dark-primary/10 
           dark:group-focus-visible:ring-white xs:h-12 xs:w-12 xs:justify-center xs:p-3 xl:w-full xl:justify-start xl:px-4 xl:py-3`,
          isActive && 'font-bold'
        )}
      >
        <HeroIcon
          className={cn(
            'h-7 w-7',
            isActive &&
              ['Explore', 'Lists'].includes(linkName) &&
              'stroke-white'
          )}
          iconName={iconName}
          solid={isActive}
        />
        <p className='hidden xl:block'>{linkName}</p>
      </div>
    </Link>
  );
}
