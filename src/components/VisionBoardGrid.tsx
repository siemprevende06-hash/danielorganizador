import { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Upload } from 'lucide-react';
import { useVisionBoard } from '@/hooks/useVisionBoard';
import { useImageUpload } from '@/hooks/useImageUpload';

export const VisionBoardGrid = () => {
  const { cards, isLoading, updateCard } = useVisionBoard('main');
  const { uploadImage, uploading } = useImageUpload();
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleImageUpload = async (cardId: string, file: File) => {
    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      updateCard(cardId, { image: imageUrl });
    }
  };

  const handleCheckChange = (cardId: string, checked: boolean) => {
    updateCard(cardId, { checked });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-6 gap-4">
        {Array.from({ length: 18 }).map((_, i) => (
          <Card key={i} className="aspect-square animate-pulse bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card
          key={card.id}
          className={cn(
            "relative aspect-square overflow-hidden transition-all cursor-pointer hover:shadow-lg",
            card.checked && "border-2 border-green-500 ring-2 ring-green-500/20"
          )}
          onClick={() => {
            if (!card.image) {
              fileInputRefs.current[card.id]?.click();
            }
          }}
        >
          <input
            ref={(el) => (fileInputRefs.current[card.id] = el)}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleImageUpload(card.id, file);
              }
            }}
          />
          
          {card.image ? (
            <>
              <img
                src={card.image}
                alt="Vision"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded p-1">
                <Checkbox
                  checked={card.checked}
                  onCheckedChange={(checked) =>
                    handleCheckChange(card.id, checked as boolean)
                  }
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
              <Upload className="h-8 w-8 mb-2" />
              <span className="text-xs">{uploading ? 'Subiendo...' : 'Subir imagen'}</span>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
