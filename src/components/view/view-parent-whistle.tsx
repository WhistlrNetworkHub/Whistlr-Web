import { useEffect } from 'react';

import { useDocument } from '@lib/hooks/useDocument';
import { whistlesCollection } from '@lib/supabase/collections';
import { Whistle } from '@components/whistle/whistle';
import type { RefObject } from 'react';

type ViewParentWhistleProps = {
  parentId: string;
  viewWhistleRef: RefObject<HTMLElement>;
};

export function ViewParentTweet({
  parentId,
  viewWhistleRef
}: ViewParentWhistleProps): React.ReactElement | null {
  const { data, loading } = useDocument(doc(whistlesCollection, parentId), {
    includeUser: true,
    allowNull: true
  });

  useEffect(() => {
    if (!loading) viewWhistleRef.current?.scrollIntoView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id, loading]);

  if (loading) return null;
  if (!data)
    return (
      <div className='px-4 pt-3 pb-2'>
        <p
          className='rounded-2xl bg-main-sidebar-background py-3 px-1 pl-4 
                     text-light-secondary dark:text-dark-secondary'
        >
          This Tweet was deleted by the Tweet author.{' '}
          <a
            className='custom-underline text-main-accent'
            href='https://help.whistlr.com/rules-and-policies/notices-on-whistlr'
            target='_blank'
            rel='noreferrer'
          >
            Learn more
          </a>
        </p>
      </div>
    );

  return <Whistle parentWhistle {...data} />;
}
