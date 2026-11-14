import { PortfolioView } from '@/components/entrepreneurship/PortfolioView';
import { useEntrepreneurshipData } from '@/hooks/useEntrepreneurshipData';

export default function EntrepreneurshipPage() {
  const data = useEntrepreneurshipData();

  return (
    <PortfolioView
      ventures={data.ventures}
      byVenture={data.byVenture}
      loading={data.loading}
      missingTables={data.missingTables}
      defaultRate={data.defaultRate}
      onCreate={data.createVenture}
      onUpdate={data.updateVenture}
      onDelete={data.deleteVenture}
    />
  );
}