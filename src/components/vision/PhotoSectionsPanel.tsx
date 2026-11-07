import { ImagePlus } from 'lucide-react';
import { BoardSectionEditor, type BoardSection } from '@/components/vision/BoardSectionEditor';
import { useTextSection } from '@/hooks/useTextSection';

/**
 * Sección de fotos de Dirección. La usan tanto Daily → Dirección como la
 * pestaña Visión de Metas Sistemas, con la misma clave de almacenamiento para
 * que ambas vistas muestren y editen exactamente las mismas secciones.
 */
export function PhotoSectionsPanel() {
  const { data: sections, setData: setSections } = useTextSection<BoardSection[]>(
    'direccion-daily-sections',
    [],
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <ImagePlus className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold tracking-tight">Secciones para fotos</h3>
        <p className="text-[10px] text-muted-foreground">
          Crea secciones, añade título y configura cada tarjeta
        </p>
      </div>
      <BoardSectionEditor
        sections={sections}
        setSections={setSections}
        uploadFolder="direccion-daily"
        emptyTitle="Sin secciones. Crea una sección para añadir fotos con nombre, sistema y color."
        emptyAction="Crear sección"
        accent="vision"
      />
    </section>
  );
}

export default PhotoSectionsPanel;
