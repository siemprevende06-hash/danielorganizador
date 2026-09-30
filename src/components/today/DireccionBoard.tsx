import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CachedImage } from "@/components/CachedImage";
import { useTextSection } from "@/hooks/useTextSection";
import { MISSION_STATEMENT, VISION_PILLARS } from "@/data/purposeStatement";
import type { BoardSection } from "@/components/vision/BoardSectionEditor";
import { Compass, Eye, Flag, Target, ChevronDown } from "lucide-react";

const MAX_VISIBLE_CARDS = 6;
const MAX_VISIBLE_SECTIONS = 6;

const PILLAR_ICONS = [Target, Compass, Eye];

export function DireccionBoard() {
  const { data: visionSections, loading } = useTextSection<BoardSection[]>('objetivo-vision-data', []);
  const [showAllSections, setShowAllSections] = useState(false);

  const sections = useMemo(() => Array.isArray(visionSections) ? visionSections : [], [visionSections]);

  const visibleSections = showAllSections
    ? sections
    : sections.slice(0, MAX_VISIBLE_SECTIONS);

  const hiddenSections = sections.length - visibleSections.length;

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-semibold">Dirección</h2>
          <Button asChild variant="ghost" size="sm" className="ml-auto h-7 px-2 text-xs text-muted-foreground">
            <Link to="/objetivo-vision-1-ano">Editar →</Link>
          </Button>
        </div>

        {/* Misión */}
        <div className="rounded-xl border border-amber-200/50 bg-amber-50/40 dark:bg-amber-950/10 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Flag className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Misión
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-foreground/90">{MISSION_STATEMENT}</p>
        </div>

        {/* Visión */}
        <div className="rounded-xl border border-sky-200/50 bg-sky-50/40 dark:bg-sky-950/10 p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-sky-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
              Visión
            </span>
            {sections.length > 0 && (
              <span className="ml-auto text-[10px] text-muted-foreground">{sections.length} secciones</span>
            )}
          </div>

          {loading && sections.length === 0 && (
            <p className="text-[11px] text-muted-foreground">Cargando…</p>
          )}

          {!loading && sections.length === 0 && (
            <p className="text-[11px] text-muted-foreground">
              Sin visión definida.{' '}
              <Link to="/objetivo-vision-1-ano" className="font-semibold text-sky-600 hover:underline">
                Configúrala aquí
              </Link>
            </p>
          )}

          {sections.length > 0 && (
            <div className="space-y-2.5">
              {visibleSections.map(section => (
                <VisionSectionRow key={section.id} section={section} />
              ))}

              {hiddenSections > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllSections(true)}
                  className="w-full flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                >
                  <ChevronDown className="h-3 w-3" />
                  +{hiddenSections} {hiddenSections === 1 ? 'sección' : 'secciones'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pilares */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {VISION_PILLARS.map((p, i) => {
            const Icon = PILLAR_ICONS[i % PILLAR_ICONS.length];
            return (
              <div key={p.title} className="rounded-xl border border-border/50 bg-card/40 p-2.5">
                <p className="text-[11px] font-bold text-amber-600 flex items-center gap-1.5">
                  <Icon className="h-3 w-3" />
                  {p.title}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{p.text}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function VisionSectionRow({ section }: { section: BoardSection }) {
  const withImages = useMemo(
    () => (section.cards || []).filter(c => !!c.image_url),
    [section.cards]
  );

  // Si hay más de las que caben, reservamos la última celda para el badge +N
  const hasOverflow = withImages.length > MAX_VISIBLE_CARDS;
  const visible = withImages.slice(0, hasOverflow ? MAX_VISIBLE_CARDS - 1 : MAX_VISIBLE_CARDS);
  const overflow = withImages.length - visible.length;

  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium text-foreground/90 truncate">{section.name}</p>
      {withImages.length === 0 ? (
        <p className="text-[10px] text-muted-foreground/70">— sin imágenes</p>
      ) : (
        <div className="grid grid-cols-6 gap-1">
          {visible.map(card => (
            <div
              key={card.id}
              className="relative aspect-square rounded-md overflow-hidden bg-muted/40"
            >
              <CachedImage
                src={card.image_url as string}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {overflow > 0 && (
            <div className="aspect-square rounded-md bg-muted/60 flex items-center justify-center">
              <span className="text-[9px] font-bold text-muted-foreground">+{overflow}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DireccionBoard;
