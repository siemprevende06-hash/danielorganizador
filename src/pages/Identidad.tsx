import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ListTodo } from "lucide-react"

export default function Identidad() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8 pt-24">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ListTodo className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Identidad</h1>
            <p className="text-sm text-muted-foreground">Lista de identidad</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Elementos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="text-sm text-muted-foreground py-2 px-3 rounded-md bg-muted/50">
                Aún no hay elementos
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
