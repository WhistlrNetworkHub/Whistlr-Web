import Link from 'next/link';
import cn from 'clsx';
import { NextImage } from '@components/ui/next-image';

type UserAvatarProps = {
  src: string;
  alt: string;
  size?: number;
  username?: string;
  className?: string;
  /**
   * If true, wraps the avatar in a Link component.
   * Set to false when the avatar is already inside a Link to avoid nested <a> tags.
   */
  isLink?: boolean;
};

export function UserAvatar({
  src,
  alt,
  size,
  username,
  className,
  isLink = true
}: UserAvatarProps): React.ReactElement {
  const pictureSize = size ?? 48;

  const avatarImage = (
    <NextImage
      useSkeleton
      imgClassName='rounded-full'
      width={pictureSize}
      height={pictureSize}
      src={src}
      alt={alt || username || 'User avatar'}
      key={src}
    />
  );

  if (!isLink || !username) {
    return (
      <div
        className={cn(
          'blur-picture flex self-start',
          className
        )}
      >
        {avatarImage}
      </div>
    );
  }

  return (
    <Link 
      href={`/user/${username}`}
      className={cn(
        'blur-picture flex self-start',
        className
      )}
      tabIndex={0}
    >
      {avatarImage}
    </Link>
  );
}
