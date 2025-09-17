import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Target, TrendingUp } from "lucide-react";
import tournamentLogo from "@/assets/white-padel-tournament-logo.png";

interface TeamStanding {
  id: string;
  player1: string;
  player2: string;
  matches: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
  points: number;
  group: string;
}

const Standings = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("5-masculino");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");

  const categories = [
    { value: "5-masculino", label: "5ta Masculino" },
    { value: "5-femenino", label: "5ta Femenino" },
    { value: "6-masculino", label: "6ta Masculino" },
    { value: "6-femenino", label: "6ta Femenino" },
    { value: "7-masculino", label: "7ta Masculino" },
    { value: "7-femenino", label: "7ta Femenino" },
  ];

  // Mock data - en producción vendrá de Supabase
  const mockStandings: TeamStanding[] = [
    {
      id: "1",
      player1: "Juan Pérez",
      player2: "Carlos López",
      matches: 3,
      wins: 3,
      losses: 0,
      setsWon: 6,
      setsLost: 1,
      gamesWon: 36,
      gamesLost: 18,
      points: 9,
      group: "A"
    },
    {
      id: "2",
      player1: "Pedro Martín",
      player2: "Luis Rodríguez",
      matches: 3,
      wins: 2,
      losses: 1,
      setsWon: 5,
      setsLost: 3,
      gamesWon: 34,
      gamesLost: 28,
      points: 6,
      group: "A"
    },
    {
      id: "3",
      player1: "Miguel Sánchez",
      player2: "David García",
      matches: 3,
      wins: 1,
      losses: 2,
      setsWon: 3,
      setsLost: 4,
      gamesWon: 28,
      gamesLost: 32,
      points: 3,
      group: "A"
    },
    {
      id: "4",
      player1: "Roberto Silva",
      player2: "Fernando Ruiz",
      matches: 3,
      wins: 0,
      losses: 3,
      setsWon: 1,
      setsLost: 6,
      gamesWon: 15,
      gamesLost: 36,
      points: 0,
      group: "A"
    }
  ];

  const filteredStandings = mockStandings
    .filter(team => selectedGroup === "all" || team.group === selectedGroup)
    .sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      if (a.setsWon - a.setsLost !== b.setsWon - b.setsLost) 
        return (b.setsWon - b.setsLost) - (a.setsWon - a.setsLost);
      return (b.gamesWon - b.gamesLost) - (a.gamesWon - a.gamesLost);
    });

  const getPositionBadge = (position: number) => {
    if (position === 1) return <Badge variant="default" className="bg-padel-gold text-primary">🥇 1°</Badge>;
    if (position === 2) return <Badge variant="secondary">🥈 2°</Badge>;
    if (position === 3) return <Badge variant="secondary">🥉 3°</Badge>;
    return <Badge variant="outline">{position}°</Badge>;
  };

  const getWinPercentage = (wins: number, matches: number) => {
    return matches > 0 ? ((wins / matches) * 100).toFixed(1) : "0.0";
  };

  return (
    <div className="min-h-screen bg-padel-gradient">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Trophy className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Tabla de Posiciones</h1>
              </div>
            </div>
            <img src={tournamentLogo} alt="White Padel" className="h-12 w-auto" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="shadow-padel mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Categoría</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Grupo</label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los grupos</SelectItem>
                    <SelectItem value="A">Grupo A</SelectItem>
                    <SelectItem value="B">Grupo B</SelectItem>
                    <SelectItem value="C">Grupo C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Standings Table */}
        <Card className="shadow-padel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Clasificación Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Pos.</TableHead>
                    <TableHead>Dupla</TableHead>
                    <TableHead className="text-center">Grupo</TableHead>
                    <TableHead className="text-center">PJ</TableHead>
                    <TableHead className="text-center">PG</TableHead>
                    <TableHead className="text-center">PP</TableHead>
                    <TableHead className="text-center">SG</TableHead>
                    <TableHead className="text-center">SP</TableHead>
                    <TableHead className="text-center">JG</TableHead>
                    <TableHead className="text-center">JP</TableHead>
                    <TableHead className="text-center">%</TableHead>
                    <TableHead className="text-center font-bold">Pts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStandings.map((team, index) => (
                    <TableRow key={team.id} className={index < 2 ? "bg-padel-gold-light" : ""}>
                      <TableCell>
                        {getPositionBadge(index + 1)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold">{team.player1}</p>
                          <p className="text-sm text-muted-foreground">{team.player2}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{team.group}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{team.matches}</TableCell>
                      <TableCell className="text-center font-medium text-green-600">
                        {team.wins}
                      </TableCell>
                      <TableCell className="text-center text-red-600">
                        {team.losses}
                      </TableCell>
                      <TableCell className="text-center">{team.setsWon}</TableCell>
                      <TableCell className="text-center">{team.setsLost}</TableCell>
                      <TableCell className="text-center">{team.gamesWon}</TableCell>
                      <TableCell className="text-center">{team.gamesLost}</TableCell>
                      <TableCell className="text-center">
                        {getWinPercentage(team.wins, team.matches)}%
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={team.points > 6 ? "default" : "secondary"}
                          className="font-bold"
                        >
                          {team.points}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-6 text-sm text-muted-foreground">
              <p><strong>Abreviaciones:</strong></p>
              <p>PJ: Partidos Jugados | PG: Partidos Ganados | PP: Partidos Perdidos</p>
              <p>SG: Sets Ganados | SP: Sets Perdidos | JG: Juegos Ganados | JP: Juegos Perdidos</p>
              <p>%: Porcentaje de victorias | Pts: Puntos totales</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Standings;