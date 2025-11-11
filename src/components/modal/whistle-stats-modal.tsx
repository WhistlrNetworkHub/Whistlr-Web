import { MainHeader } from '@components/home/main-header';
import type { ReactNode } from 'react';
import type { StatsType } from '@components/view/view-whistle-stats';

type WhistleStatsModalProps = {
  children: ReactNode;
  statsType: StatsType | null;
  handleClose: () => void;
};

export function WhistleStatsModal({
  children,
  statsType,
  handleClose
}: WhistleStatsModalProps): React.ReactElement {
  return (
    <>
      <MainHeader
        useActionButton
        disableSticky
        tip='Close'
        iconName='XMarkIcon'
        className='absolute flex w-full items-center gap-6 rounded-tl-2xl'
        title={`${statsType === 'likes' ? 'Liked' : 'Retweeted'} by`}
        action={handleClose}
      />
      {children}
    </>
  );
}
