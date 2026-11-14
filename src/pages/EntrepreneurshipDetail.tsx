import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VentureDashboard } from '@/components/entrepreneurship/VentureDashboard';
import { useEntrepreneurshipData } from '@/hooks/useEntrepreneurshipData';
import { buildAnalytics } from '@/lib/entrepreneurship/metrics';

export default function EntrepreneurshipDetail() {
  const { id } = useParams<{ id: string }>();
  const data = useEntrepreneurshipData();
  const ventureData = id ? data.byVenture[id] : undefined;

  const analytics = useMemo(
    () => (ventureData ? buildAnalytics(ventureData, { defaultRate: data.defaultRate }) : null),
    [ventureData, data.defaultRate],
  );

  if (data.loading) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 pt-20 pb-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!ventureData || !analytics) {
    return (
      <div className="container mx-auto max-w-lg px-4 pt-24 pb-24">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-8 text-center">
          <Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Emprendimiento no encontrado</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Puede que se haya eliminado o que el enlace esté mal.
          </p>
          <Link to="/entrepreneurship">
            <Button variant="outline" className="mt-4 gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Volver al portafolio
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <VentureDashboard
      data={ventureData}
      analytics={analytics}
      defaultRate={data.defaultRate}
      missingTables={data.missingTables}
      actions={data}
    />
  );
}