import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link2, Target } from "lucide-react";

interface Block {
  id: string;
  title: string;
  duration?: number;
}

interface GoalBlockConnectorProps {
  goalId: string;
  goalTitle: string;
  availableBlocks: Block[];
  currentConnections: string[];
  onUpdate: () => void;
}

export function GoalBlockConnector({
  goalId,
  goalTitle,
  availableBlocks,
  currentConnections,
  onUpdate,
}: GoalBlockConnectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>(currentConnections);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleToggle = (blockId: string) => {
    setSelectedBlocks(prev =>
      prev.includes(blockId)
        ? prev.filter(id => id !== blockId)
        : [...prev, blockId]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete old connections
      await supabase
        .from('goal_block_connections')
        .delete()
        .eq('goal_id', goalId);

      // Insert new connections
      if (selectedBlocks.length > 0) {
        const connections = selectedBlocks.map(blockId => {
          const block = availableBlocks.find(b => b.id === blockId);
          return {
            goal_id: goalId,
            user_id: user.id,
            block_id: blockId,
            block_name: block?.title || '',
            contribution_percentage: Math.round(100 / selectedBlocks.length),
          };
        });

        const { error } = await supabase
          .from('goal_block_connections')
          .insert(connections);

        if (error) throw error;
      }

      toast({
        title: "Conexiones actualizadas",
        description: `${selectedBlocks.length} bloques conectados a la meta`,
      });

      onUpdate();
      setOpen(false);
    } catch (error) {
      console.error('Error saving connections:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar las conexiones",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Link2 className="h-4 w-4 mr-2" />
        Conectar Bloques ({currentConnections.length})
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Conectar Bloques a Meta
            </DialogTitle>
            <DialogDescription>
              Selecciona los bloques de rutina que contribuyen a: <strong>{goalTitle}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {availableBlocks.map((block) => (
              <div
                key={block.id}
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <Checkbox
                  id={`block-${block.id}`}
                  checked={selectedBlocks.includes(block.id)}
                  onCheckedChange={() => handleToggle(block.id)}
                />
                <Label
                  htmlFor={`block-${block.id}`}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{block.title}</span>
                    {block.duration && (
                      <span className="text-sm text-muted-foreground">
                        {block.duration} min
                      </span>
                    )}
                  </div>
                </Label>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar Conexiones"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
