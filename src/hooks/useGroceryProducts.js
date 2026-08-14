import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
export function useGroceryProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => {
        const { data } = await supabase
            .from("grocery_products")
            .select("*")
            .order("name");
        setProducts(data || []);
        setLoading(false);
    }, []);
    useEffect(() => { load(); }, [load]);
    const createProduct = async (input) => {
        const { data, error } = await supabase
            .from("grocery_products")
            .insert(input)
            .select()
            .single();
        if (!error && data) {
            await load();
            return data.id;
        }
        return null;
    };
    const updateProduct = async (id, input) => {
        await supabase.from("grocery_products").update(input).eq("id", id);
        await load();
    };
    const deleteProduct = async (id) => {
        await supabase.from("grocery_products").delete().eq("id", id);
        await load();
    };
    const adjustStock = async (id, delta) => {
        const p = products.find(p => p.id === id);
        if (!p)
            return;
        const newStock = Math.max(0, (p.current_stock || 0) + delta);
        await supabase.from("grocery_products").update({ current_stock: newStock }).eq("id", id);
        await load();
    };
    const unitCost = (p) => (p.price || 0) / Math.max(1, p.package_quantity || 1);
    return {
        products,
        loading,
        createProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        unitCost,
        reload: load,
    };
}
