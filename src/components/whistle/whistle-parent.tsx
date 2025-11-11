import { useMemo, useEffect } from 'react';

import { useDocument } from '@lib/hooks/useDocument';
import { whistlesCollection } from '@lib/supabase/collections';
import { getRandomId } from '@lib/random';
import { Whistle } from './tweet';
import type { LoadedParents } from './whistle-with-parent';

type WhistleParentProps = {
  parentId: string;
  loadedParents: LoadedParents;
  addParentId: (parentId: string, componentId: string) => void;
};

export function WhistleParent({
  parentId,
  loadedParents,
  addParentId
}: WhistleParentProps): React.ReactElement | null {
  const componentId = useMemo(getRandomId, []);

  const isParentAlreadyLoaded = loadedParents.some(
    (child) => child.childId === componentId
  );

  const { data, loading } = useDocument(doc(whistlesCollection, parentId), {
    includeUser: true,
    allowNull: true,
    disabled: isParentAlreadyLoaded
  });

  useEffect(() => {
    addParentId(parentId, componentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !isParentAlreadyLoaded || !data) return null;

  return <Whistle parentWhistle {...data} />;
}
