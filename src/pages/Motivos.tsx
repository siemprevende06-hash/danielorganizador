import MotivosBoard from "@/components/motivos/MotivosBoard";

export default function Motivos() {
  return (
    <MotivosBoard
      storageKey="motivos-data"
      uploadFolder="motivos"
      title="Motivos"
      description="Crea secciones con cuadr�culas de im�genes desde tu galer�a"
    />
  );
}
