import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Target, Award } from "lucide-react";
import { Link } from "react-router-dom";
import whitePadelLogo from "@/assets/white-padel-logo.png";
import tournamentLogo from "@/assets/white-padel-tournament-logo.png";

const Index = () => {
  const categories = [
    { id: "5-masculino", name: "5ta Masculino", players: 0 },
    { id: "5-femenino", name: "5ta Femenino", players: 0 },
    { id: "6-masculino", name: "6ta Masculino", players: 0 },
    { id: "6-femenino", name: "6ta Femenino", players: 0 },
    { id: "7-masculino", name: "7ta Masculino", players: 0 },
    { id: "7-femenino", name: "7ta Femenino", players: 0 },
  ];

  return (
    <div className="min-h-screen bg-padel-gradient">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-4">
            <img 
              src={tournamentLogo} 
              alt="White Padel Tournament" 
              className="h-16 w-auto object-contain"
            />
            <h1 className="text-3xl font-bold tracking-tight">White Padel Tournament</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold mb-4">Gestión del Torneo</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Administra jugadores, grupos, clasificaciones y resultados de tu torneo de pádel de manera profesional.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {categories.map((category) => (
            <Card key={category.id} className="shadow-padel hover:shadow-padel-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>{category.name}</span>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </CardTitle>
                <CardDescription>
                  {category.players} duplas registradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to={`/category/${category.id}`}>
                  <Button className="w-full" variant="outline">
                    Gestionar Categoría
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="shadow-padel hover:shadow-padel-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Grupos y Clasificación
              </CardTitle>
              <CardDescription>
                Organiza grupos y gestiona las clasificaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/groups">
                <Button className="w-full">
                  Ver Grupos
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-padel hover:shadow-padel-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Tabla de Posiciones
              </CardTitle>
              <CardDescription>
                Consulta puntos y posiciones actuales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/standings">
                <Button className="w-full">
                  Ver Tabla
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-padel hover:shadow-padel-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Eliminatorias
              </CardTitle>
              <CardDescription>
                Cuartos, semis y final del torneo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/brackets">
                <Button className="w-full">
                  Ver Llaves
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;