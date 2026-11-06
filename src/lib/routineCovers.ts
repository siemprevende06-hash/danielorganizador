interface RoutineCoverBlock {
  id: string;
  title: string;
  currentFocus?: string;
  defaultFocus?: string;
}

/** `true` para el bloque "Bloque Extra" de la rutina. */
export const isExtraRoutineBlock = (block: Pick<RoutineCoverBlock, 'id' | 'title'>) =>
  block.title.toLowerCase().includes('bloque extra') ||
  block.id.includes('bloque-extra');

/**
 * Clave de portada de un bloque de rutina. El Bloque Extra usa una portada
 * distinta por cada objetivo elegido dentro del bloque.
 */
export const routineBlockCoverId = (block: RoutineCoverBlock) => {
  if (!isExtraRoutineBlock(block)) return block.id;
  const focus = block.currentFocus || block.defaultFocus || 'none';
  return `${block.id}:focus:${focus}`;
};
