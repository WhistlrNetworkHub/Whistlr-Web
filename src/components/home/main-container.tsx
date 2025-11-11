import cn from 'clsx';
import type { ReactNode } from 'react';

type MainContainerProps = {
  children: ReactNode;
  className?: string;
};

export function MainContainer({
  children,
  className
}: MainContainerProps): React.ReactElement {
  return (
    <main
      className={cn(
        `hover-animation flex min-h-screen w-full max-w-xl flex-col border-x-0
         glass-morphism-light pb-96 xs:border-x`,
        className
      )}
    >
      {children}
    </main>
  );
}
