import { useMemo } from "react";
export function useShoppingGenerator(plan, products) {
    return useMemo(() => {
        const needed = {};
        plan.forEach(p => {
            const ings = (p.recipe?.ingredients || []);
            ings.forEach((ing) => {
                const pid = ing.product_id;
                const product = pid ? products.find(pr => pr.id === pid) : null;
                const key = pid || `__raw__${ing.name.toLowerCase()}`;
                const qty = Number(ing.quantity_for_recipe ?? ing.quantity ?? 0);
                if (!needed[key]) {
                    needed[key] = {
                        productId: pid || null,
                        productName: product?.name || ing.name || "?",
                        storageType: product?.storage_type || "shelf",
                        category: product?.category || null,
                        unit: product?.unit || ing.unit || "unidad",
                        totalNeeded: 0,
                        price: product?.price || 0,
                        packageQuantity: product?.package_quantity || 1,
                        ingredients: [],
                    };
                }
                needed[key].totalNeeded += qty;
                needed[key].ingredients.push(`${p.recipe?.name || "?"}: ${qty} ${ing.unit || ""}`);
            });
        });
        return Object.values(needed).map(item => {
            const inStock = item.productId
                ? (products.find(p => p.id === item.productId)?.current_stock || 0)
                : 0;
            const unitCostVal = (item.price || 0) / Math.max(1, item.packageQuantity || 1);
            const toBuy = Math.max(0, item.totalNeeded - inStock);
            return {
                productId: item.productId,
                productName: item.productName,
                storageType: item.storageType,
                category: item.category,
                unit: item.unit,
                totalNeeded: item.totalNeeded,
                inStock,
                toBuy,
                price: item.price,
                packageQuantity: item.packageQuantity,
                unitCost: unitCostVal,
                estimatedCost: toBuy * unitCostVal,
                ingredients: item.ingredients,
            };
        }).sort((a, b) => {
            const order = { refrigerator: 0, freezer: 1, shelf: 2 };
            return (order[a.storageType] || 0) - (order[b.storageType] || 0);
        });
    }, [plan, products]);
}
