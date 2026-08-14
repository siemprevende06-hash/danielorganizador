import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
export const useVisionBoard = (boardType = 'main') => {
    const [cards, setCards] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const latestBoardType = useRef(boardType);
    latestBoardType.current = boardType;
    const saveBoard = useCallback(async (newCards) => {
        try {
            await supabase
                .from('vision_boards')
                .update({ cards: newCards })
                .eq('board_type', latestBoardType.current);
        }
        catch (error) {
            console.error('Error updating vision board:', error);
        }
    }, []);
    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                // Flush handled by latest state in updateCards
            }
        };
        document.addEventListener("visibilitychange", onVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
    }, []);
    useEffect(() => {
        const loadBoard = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('vision_boards')
                    .select('*')
                    .eq('board_type', boardType)
                    .maybeSingle();
                if (error)
                    throw error;
                if (data) {
                    const cardsData = data.cards;
                    setCards(cardsData || []);
                }
                else {
                    const initialCards = Array.from({ length: 18 }, (_, i) => ({
                        id: `vision-card-${i}`,
                        image: null,
                        checked: false,
                    }));
                    await supabase.from('vision_boards').insert({
                        board_type: boardType,
                        cards: initialCards,
                    });
                    setCards(initialCards);
                }
            }
            catch (error) {
                console.error('Error loading vision board:', error);
            }
            finally {
                setIsLoading(false);
            }
        };
        loadBoard();
    }, [boardType]);
    const updateCards = useCallback(async (newCards) => {
        setCards(newCards);
        saveBoard(newCards);
    }, [saveBoard]);
    const updateCard = useCallback(async (cardId, updates) => {
        const newCards = cards.map(card => card.id === cardId ? { ...card, ...updates } : card);
        await updateCards(newCards);
    }, [cards, updateCards]);
    return { cards, isLoading, updateCards, updateCard };
};
