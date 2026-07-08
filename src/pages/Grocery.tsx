import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGroceryProducts, type GroceryProductInput } from "@/hooks/useGroceryProducts";
import { ShelfView } from "@/components/grocery/ShelfView";
import { FridgeView } from "@/components/grocery/FridgeView";
import { CostAnalysis } from "@/components/grocery/CostAnalysis";
import { useRecipes } from "@/hooks/useRecipes";
import { Package, BarChart3, ShoppingCart } from "lucide-react";

export default function Grocery() {
  const { products, loading, createProduct, updateProduct, deleteProduct, adjustStock } = useGroceryProducts();
  const { recipes } = useRecipes();
  const [tab, setTab] = useState("products");

  if (loading) return <div className="p-8 text-center text-sm">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8 pt-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10">
              <Package className="h-7 w-7 text-amber-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              Despensa
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {products.length} productos · Stock total: {products.reduce((s, p) => s + (p.current_stock || 0), 0)} uds
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="products" className="flex-1">
              <Package className="h-4 w-4 mr-1" />Productos
            </TabsTrigger>
            <TabsTrigger value="costs" className="flex-1">
              <BarChart3 className="h-4 w-4 mr-1" />Costos
            </TabsTrigger>
            <TabsTrigger value="shopping" className="flex-1">
              <ShoppingCart className="h-4 w-4 mr-1" />Lista
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <ShelfView
              products={products}
              onCreate={createProduct}
              onUpdate={updateProduct}
              onDelete={deleteProduct}
              onAdjustStock={adjustStock}
            />
            <FridgeView
              products={products}
              onCreate={createProduct}
              onUpdate={updateProduct}
              onDelete={deleteProduct}
              onAdjustStock={adjustStock}
            />
          </TabsContent>

          <TabsContent value="costs">
            <CostAnalysis recipes={recipes} products={products} />
          </TabsContent>

          <TabsContent value="shopping">
            <div className="text-center py-12 text-sm text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Genera tu lista de compra desde</p>
              <p className="font-medium">Alimentación → Planificar</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
