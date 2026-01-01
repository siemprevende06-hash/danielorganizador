import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VisionCard {
  id: string;
  image: string | null;
  checked: boolean;
}

export const useVisionBoard = (boardType: string = 'main') => {
  const [cards, setCards] = useState<VisionCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBoard = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('vision_boards')
          .select('*')
          .eq('board_type', boardType)
          .maybeSingle();

        if (error) throw error;

        const localStorageKey = boardType === 'main' ? 'visionBoardCards' : 'idealPartnerVision';
        
        if (data) {
          const cardsData = data.cards as unknown as VisionCard[];
          setCards(cardsData || []);
        } else {
          // Check for migration
          const stored = localStorage.getItem(localStorageKey);
          if (stored) {
            const localCards = JSON.parse(stored) as VisionCard[];
            await supabase.from('vision_boards').insert({
              board_type: boardType,
              cards: localCards as any,
            } as any);
            setCards(localCards);
            localStorage.removeItem(localStorageKey);
          } else {
            // Initialize with 18 empty cards
            const initialCards = Array.from({ length: 18 }, (_, i) => ({
              id: `vision-card-${i}`,
              image: null,
              checked: false,
            }));
            await supabase.from('vision_boards').insert({
              board_type: boardType,
              cards: initialCards as any,
            } as any);
            setCards(initialCards);
          }
        }
      } catch (error) {
        console.error('Error loading vision board:', error);
        const localStorageKey = boardType === 'main' ? 'visionBoardCards' : 'idealPartnerVision';
        const stored = localStorage.getItem(localStorageKey);
        if (stored) setCards(JSON.parse(stored));
      } finally {
        setIsLoading(false);
      }
    };

    loadBoard();
  }, [boardType]);

  const updateCards = useCallback(async (newCards: VisionCard[]) => {
    setCards(newCards);
    try {
      await supabase
        .from('vision_boards')
        .update({ cards: newCards as any })
        .eq('board_type', boardType);
    } catch (error) {
      console.error('Error updating vision board:', error);
    }
  }, [boardType]);

  const updateCard = useCallback(async (cardId: string, updates: Partial<VisionCard>) => {
    const newCards = cards.map(card =>
      card.id === cardId ? { ...card, ...updates } : card
    );
    await updateCards(newCards);
  }, [cards, updateCards]);

  return { cards, isLoading, updateCards, updateCard };
};
