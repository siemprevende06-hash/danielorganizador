import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpenCheck, ListChecks, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTIONS_MARKER = /^##[^\n]*acciones\s+pr[aá]?cticas?.*$/im;
const SUMMARY_HEADING = /^##[^\n]*resumen[^\n]*$/im;

const components: Components = {
  h2: ({ children }) => (
    <h2 className="text-lg font-bold text-foreground mt-5 mb-2 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-foreground mt-4 mb-2 first:mt-0">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-sm leading-relaxed text-foreground/90 mb-3 last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 space-y-2 my-3 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 space-y-2.5 my-3 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-sm leading-relaxed text-foreground/90 pl-0.5">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary/40 pl-3 my-3 text-sm italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-border" />,
  a: ({ children, ...props }) => (
    <a className="text-primary underline underline-offset-2" {...props}>
      {children}
    </a>
  ),
};

function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
}

interface BookContentProps {
  notes: string | null;
  className?: string;
}

export function BookContent({ notes, className }: BookContentProps) {
  const raw = notes?.trim() ?? "";
  const markerIdx = raw.search(ACTIONS_MARKER);

  let summary = "";
  let actions = "";
  if (markerIdx >= 0) {
    summary = raw.slice(0, markerIdx).replace(SUMMARY_HEADING, "").trim();
    actions = raw.slice(markerIdx).replace(ACTIONS_MARKER, "").trim();
  } else {
    summary = raw.replace(SUMMARY_HEADING, "").trim();
  }

  const hasSummary = summary.length > 0;

  return (
    <div className={cn("space-y-4", className)}>
      {hasSummary && (
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <BookOpenCheck className="w-4 h-4 text-primary" />
              <div>
                <h4 className="text-sm font-semibold">Resumen, enseñanzas y puntos de vista</h4>
                <p className="text-xs text-muted-foreground">Ideas clave y lecciones del autor</p>
              </div>
            </div>
            <div>
              <Markdown>{summary}</Markdown>
            </div>
          </CardContent>
        </Card>
      )}

      {actions && (
        <Card className="border-l-4 border-l-green-500/70">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <ListChecks className="w-4 h-4 text-green-600 dark:text-green-400" />
              <div>
                <h4 className="text-sm font-semibold">Acciones prácticas</h4>
                <p className="text-xs text-muted-foreground">Pasos concretos para aplicar lo aprendido</p>
              </div>
            </div>
            <div>
              <Markdown>{actions}</Markdown>
            </div>
          </CardContent>
        </Card>
      )}

      {!hasSummary && !actions && (
        <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
          <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Este libro aún no tiene contenido editado.</p>
          <p className="text-xs mt-1">Pulsa «Editar contenido» para añadir resumen, enseñanzas y acciones.</p>
        </div>
      )}
    </div>
  );
}