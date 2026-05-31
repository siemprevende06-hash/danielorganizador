import { Heart, Lightbulb, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Purpose() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-4">
            Mi Propósito
          </h1>
          <p className="text-xl text-gray-600">
            La razón por la que hago lo que hago
          </p>
        </div>

        {/* Main Purpose Statement */}
        <Card className="mb-8 border-2 border-purple-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-100 to-blue-100">
            <CardTitle className="text-2xl text-purple-900">Mi Misión</CardTitle>
            <CardDescription className="text-purple-700">
              El propósito central de mi vida y trabajo
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-lg text-gray-700 leading-relaxed">
                Crear y construir sistemas que me permitan vivir de manera intencional, 
                productiva y alineada con mis valores. Mi propósito es ser la mejor versión 
                de mí mismo a través de la disciplina, el aprendizaje continuo y la excelencia.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Todo lo que hago está diseñado para:
              </p>
              <ul className="space-y-2 pl-4">
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold">•</span>
                  <span className="text-gray-700">Maximizar mi potencial personal y profesional</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold">•</span>
                  <span className="text-gray-700">Desarrollar sistemas que me hagan más eficiente</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold">•</span>
                  <span className="text-gray-700">Mantenerme enfocado en lo que realmente importa</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold">•</span>
                  <span className="text-gray-700">Impactar positivamente en mi entorno</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Three Pillars */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2 border-purple-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Lightbulb className="w-6 h-6 text-purple-600" />
                <CardTitle>Crecimiento</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Aprender constantemente, mejorar mis habilidades y expandir mis conocimientos 
                en áreas que importan para mi propósito.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-6 h-6 text-blue-600" />
                <CardTitle>Enfoque</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Mantenerme concentrado en mis objetivos principales, eliminando distracciones 
                y tomando decisiones alineadas con mis prioridades.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-pink-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Heart className="w-6 h-6 text-pink-600" />
                <CardTitle>Excelencia</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Hacer todo con excelencia, desarrollar disciplina y buscar la perfección 
                en lo que importa.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Why I Build This App */}
        <Card className="border-2 border-green-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100">
            <CardTitle className="text-2xl text-green-900">¿Por qué construí Daniel Organizador?</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-gray-700">
                Esta aplicación es el reflejo de mi compromiso con la excelencia personal. 
                La creé para tener un sistema integrado que me permita:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Organización Total</h4>
                  <p className="text-sm text-gray-700">
                    Desde mi rutina diaria hasta mis objetivos anuales, todo en un solo lugar.
                  </p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-emerald-900 mb-2">Seguimiento Constante</h4>
                  <p className="text-sm text-gray-700">
                    Monitorear mi progreso en hábitos, financias, aprendizaje y más.
                  </p>
                </div>
                <div className="bg-teal-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-teal-900 mb-2">Visualización Clara</h4>
                  <p className="text-sm text-gray-700">
                    Ver dónde estoy, a dónde quiero ir y cuál es mi camino.
                  </p>
                </div>
                <div className="bg-cyan-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-cyan-900 mb-2">Acción Consistente</h4>
                  <p className="text-sm text-gray-700">
                    Tomar decisiones diarias alineadas con mis objetivos principales.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}