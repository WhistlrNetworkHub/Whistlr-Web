import { useState } from 'react';
import { Whistle } from './tweet';
import { WhistleParent } from './whistle-parent';
import type { WhistleWithUser } from '@lib/types/whistle';

type WhistleWithParentProps = {
  data: WhistleWithUser[];
};

export type LoadedParents = Record<'parentId' | 'childId', string>[];

export function WhistleWithParent({ data }: WhistleWithParentProps): React.ReactElement {
  const [loadedParents, setLoadedParents] = useState<LoadedParents>([]);

  const addParentId = (parentId: string, targetChildId: string): void =>
    setLoadedParents((prevLoadedParents) =>
      prevLoadedParents.some((item) => item.parentId === parentId)
        ? prevLoadedParents
        : [...prevLoadedParents, { parentId, childId: targetChildId }]
    );

  const filteredData = data.filter(
    (child) => !loadedParents.some((parent) => parent.parentId === child.id)
  );

  return (
    <>
      {filteredData.map((whistle) => (
        <div className='[&>article:nth-child(2)]:-mt-1' key={whistle.id}>
          {tweet.parent && (
            <WhistleParent
              parentId={tweet.parent.id}
              loadedParents={loadedParents}
              addParentId={addParentId}
            />
          )}
          <Whistle {...whistle} />
        </div>
      ))}
    </>
  );
}
