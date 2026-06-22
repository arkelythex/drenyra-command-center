import { useEffect, useState } from 'react';
import type { SireDiffRow } from '../../types/artifact.types';
import { getNextSelectedRowId } from './utils';

interface UseSireRowSelectionInput {
  visibleRows: SireDiffRow[];
  initialRowId?: string | null;
  onSelectionReset: () => void;
}

export function useSireRowSelection({
  visibleRows,
  initialRowId = null,
  onSelectionReset,
}: UseSireRowSelectionInput) {
  const [selectedRowId, setSelectedRowId] = useState<string | null>(initialRowId);

  useEffect(() => {
    if (visibleRows.length === 0) {
       
      setSelectedRowId(null);
      onSelectionReset();
      return;
    }

    const selectedStillVisible = selectedRowId
      ? visibleRows.some((row) => row.id === selectedRowId)
      : false;

    if (!selectedStillVisible) {
      setSelectedRowId(visibleRows[0].id);
      onSelectionReset();
    }
  }, [onSelectionReset, selectedRowId, visibleRows]);

  const moveSelection = (direction: 'up' | 'down') => {
    const nextId = getNextSelectedRowId(visibleRows, selectedRowId, direction);
    setSelectedRowId(nextId);
  };

  return {
    selectedRowId,
    setSelectedRowId,
    moveSelection,
  };
}
