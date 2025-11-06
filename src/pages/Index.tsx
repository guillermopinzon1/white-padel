import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Target, Award, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import whitePadelLogo from "@/assets/white-padel-logo.png";
import tournamentLogo from "@/assets/white-padel-tournament-logo.png";
import { useTeams } from "@/hooks/useSupabase";

const Index = () => {
  const { data: masculinoTeams } = useTeams("Masculino");
  const { data: femeninoTeams } = useTeams("Femenino");

  const categories = [
    { id: "masculino", name: "Masculino", players: masculinoTeams?.length || 0 },
    { id: "femenino", name: "Femenino", players: femeninoTeams?.length || 0 },
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
        <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
          {categories.map((category) => (
            <Card key={category.id} className="shadow-padel hover:shadow-padel-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-xl">
                  <span>{category.name}</span>
                  <Users className="h-6 w-6 text-muted-foreground" />
                </CardTitle>
                <CardDescription>
                  {category.players} duplas registradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to={`/category/${category.id}`}>
                  <Button className="w-full" variant="outline" size="lg">
                    Gestionar Categoría
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-padel hover:shadow-padel-lg transition-all duration-300 border-2 border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Target className="h-5 w-5" />
                Gestor de Torneo
              </CardTitle>
              <CardDescription>
                Configura grupos, genera partidos y registra resultados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/tournament">
                <Button className="w-full" size="lg">
                  Abrir Gestor
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-padel hover:shadow-padel-lg transition-all duration-300 border-2 border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Calendar className="h-5 w-5" />
                Tabla de Partidos
              </CardTitle>
              <CardDescription>
                Visualiza todos los partidos programados y resultados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/matches-table">
                <Button className="w-full" size="lg" variant="outline">
                  Ver Tabla
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