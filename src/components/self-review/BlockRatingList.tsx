import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface BlockRating {
  blockId: string;
  blockTitle: string;
  rating: number;
  notes?: string;
  status: 'completed' | 'partial' | 'skipped';
}

interface Block {
  id: string;
  block_id: string;
  title: string;
  start_time: string;
  end_time: string;
}

interface Props {
  blockRatings: BlockRating[];
  onRatingChange: (blockId: string, rating: number, notes?: string, status?: 'completed' | 'partial' | 'skipped') => void;
}

export function BlockRatingList({ blockRatings, onRatingChange }: Props) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlocks();
  }, []);

  const loadBlocks = async () => {
    const { data } = await supabase
      .from('routine_blocks')
      .select('id, block_id, title, start_time, end_time')
      .order('start_time', { ascending: true });

    setBlocks(data || []);
    setLoading(false);
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const hour = h % 12 || 12;
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const getBlockRating = (blockId: string) => {
    return blockRatings.find(br => br.blockId === blockId);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-warning" />;
      case 'skipped':
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return null;
    }
  };

  const handleStatusClick = (blockId: string, currentStatus?: string) => {
    const statuses: ('completed' | 'partial' | 'skipped')[] = ['completed', 'partial', 'skipped'];
    const currentIndex = statuses.indexOf(currentStatus as any);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    const currentRating = getBlockRating(blockId);
    onRatingChange(blockId, currentRating?.rating || 0, currentRating?.notes, nextStatus);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse h-16 bg-muted rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
        Calificación por Bloque
      </h3>

      <div className="space-y-3">
        {blocks.map((block) => {
          const rating = getBlockRating(block.block_id);
          
          return (
            <div 
              key={block.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              {/* Status */}
              <button
                onClick={() => handleStatusClick(block.block_id, rating?.status)}
                className="flex-shrink-0 p-1 hover:bg-muted rounded transition-colors"
                title="Click para cambiar estado"
              >
                {getStatusIcon(rating?.status) || (
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                )}
              </button>

              {/* Time & Title */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{block.title}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {formatTime(block.start_time)} - {formatTime(block.end_time)}
                </p>
              </div>

              {/* Stars */}
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => onRatingChange(block.block_id, star, rating?.notes, rating?.status)}
                    className="p-0.5 hover:scale-110 transition-transform"
                  >
                    <Star 
                      className={`w-5 h-5 ${
                        (rating?.rating || 0) >= star 
                          ? 'fill-foreground text-foreground' 
                          : 'text-muted-foreground'
                      }`} 
                    />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
