import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type BlockType = 'fijo' | 'dinamico' | 'configurable' | 'evitar';
export type BlockFocus = 'universidad' | 'emprendimiento' | 'proyectos' | 'none';

export interface SubBlock {
  id: string;
  title: string;
  duration: number;
  completed?: boolean;
  focus?: string;
}

export interface RoutineBlock {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  tasks: string[];
  isFocusBlock?: boolean;
  order: number;
  // New fields for advanced routine management
  blockType: BlockType;
  defaultFocus: BlockFocus;
  currentFocus?: BlockFocus;
  canSubdivide: boolean;
  emergencyOnly: boolean;
  subBlocks: SubBlock[];
  notes?: string;
}

export const parseTime = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const formatTimeDisplay = (timeStr: string): string => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export const useRoutineBlocksDB = () => {
  const [blocks, setBlocks] = useState<RoutineBlock[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);

  useEffect(() => {
    const loadBlocks = async () => {
      try {
        const { data, error } = await supabase
          .from('routine_blocks')
          .select('*')
          .order('order_index', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const formattedBlocks: RoutineBlock[] = data.map((row: any) => ({
            id: row.block_id,
            title: row.title,
            startTime: row.start_time,
            endTime: row.end_time,
            tasks: row.tasks || [],
            isFocusBlock: row.block_type === 'configurable' || row.block_type === 'dinamico' || row.title.includes('Deep Work'),
            order: row.order_index,
            blockType: (row.block_type as BlockType) || 'fijo',
            defaultFocus: (row.default_focus as BlockFocus) || 'none',
            currentFocus: (row.current_focus as BlockFocus) || undefined,
            canSubdivide: row.can_subdivide || false,
            emergencyOnly: row.emergency_only || false,
            subBlocks: row.sub_blocks || [],
            notes: row.notes || undefined,
          }));
          setBlocks(formattedBlocks);
        }
      } catch (error) {
        console.error('Error loading routine blocks:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadBlocks();
  }, []);

  const saveBlocks = useCallback(async (newBlocks: RoutineBlock[]) => {
    setBlocks(newBlocks);
    try {
      // Update blocks one by one to preserve new fields
      for (const block of newBlocks) {
        await supabase.from('routine_blocks')
          .update({
            title: block.title,
            start_time: block.startTime,
            end_time: block.endTime,
            tasks: block.tasks,
            order_index: block.order,
            block_type: block.blockType,
            default_focus: block.defaultFocus,
            current_focus: block.currentFocus,
            can_subdivide: block.canSubdivide,
            emergency_only: block.emergencyOnly,
            sub_blocks: JSON.parse(JSON.stringify(block.subBlocks)),
            notes: block.notes,
          })
          .eq('block_id', block.id);
      }
    } catch (error) {
      console.error('Error saving routine blocks:', error);
    }
  }, []);

  const reorderBlocks = useCallback((startIndex: number, endIndex: number) => {
    const result = Array.from(blocks);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    const reordered = result.map((block, index) => ({ ...block, order: index }));
    saveBlocks(reordered);
  }, [blocks, saveBlocks]);

  const updateBlock = useCallback((updatedBlock: RoutineBlock) => {
    const newBlocks = blocks.map(block =>
      block.id === updatedBlock.id ? updatedBlock : block
    );
    saveBlocks(newBlocks);
  }, [blocks, saveBlocks]);

  const getCurrentBlock = useCallback((): RoutineBlock | null => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const block of blocks) {
      const startMinutes = parseTime(block.startTime);
      let endMinutes = parseTime(block.endTime);

      if (endMinutes <= startMinutes) {
        if (currentMinutes >= startMinutes || currentMinutes < endMinutes) {
          return block;
        }
      } else if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
        return block;
      }
    }
    return null;
  }, [blocks]);

  const getBlockDurationMinutes = useCallback((block: RoutineBlock): number => {
    const startMinutes = parseTime(block.startTime);
    let endMinutes = parseTime(block.endTime);
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }
    return endMinutes - startMinutes;
  }, []);

  const getBlockProgress = useCallback((block: RoutineBlock): number => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = parseTime(block.startTime);
    let endMinutes = parseTime(block.endTime);

    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }

    const totalDuration = endMinutes - startMinutes;
    let elapsed = currentMinutes - startMinutes;
    if (elapsed < 0) elapsed += 24 * 60;

    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  }, []);

  // Toggle emergency mode - converts dynamic blocks to university focus
  const toggleEmergencyMode = useCallback((active: boolean) => {
    setEmergencyMode(active);
    const updatedBlocks = blocks.map(block => {
      if (block.blockType === 'dinamico' || block.blockType === 'evitar') {
        return {
          ...block,
          currentFocus: active ? 'universidad' as BlockFocus : block.defaultFocus,
        };
      }
      return block;
    });
    saveBlocks(updatedBlocks);
  }, [blocks, saveBlocks]);

  // Update a block's current focus
  const updateBlockFocus = useCallback((blockId: string, focus: BlockFocus) => {
    const updatedBlocks = blocks.map(block => {
      if (block.id === blockId) {
        return { ...block, currentFocus: focus };
      }
      return block;
    });
    saveBlocks(updatedBlocks);
  }, [blocks, saveBlocks]);

  // Update sub-blocks for a block
  const updateSubBlocks = useCallback((blockId: string, subBlocks: SubBlock[]) => {
    const updatedBlocks = blocks.map(block => {
      if (block.id === blockId) {
        return { ...block, subBlocks };
      }
      return block;
    });
    saveBlocks(updatedBlocks);
  }, [blocks, saveBlocks]);

  // Calculate total hours by focus type
  const getHoursByFocus = useCallback(() => {
    const hours = {
      universidad: 0,
      emprendimiento: 0,
      proyectos: 0,
      otros: 0,
    };

    blocks.forEach(block => {
      const duration = getBlockDurationMinutes(block) / 60;
      const focus = block.currentFocus || block.defaultFocus;
      
      if (focus === 'universidad') hours.universidad += duration;
      else if (focus === 'emprendimiento') hours.emprendimiento += duration;
      else if (focus === 'proyectos') hours.proyectos += duration;
      else hours.otros += duration;
    });

    return hours;
  }, [blocks, getBlockDurationMinutes]);

  return {
    blocks,
    isLoaded,
    emergencyMode,
    reorderBlocks,
    updateBlock,
    getCurrentBlock,
    getBlockDurationMinutes,
    getBlockProgress,
    saveBlocks,
    toggleEmergencyMode,
    updateBlockFocus,
    updateSubBlocks,
    getHoursByFocus,
  };
};
