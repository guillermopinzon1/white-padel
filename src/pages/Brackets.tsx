import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Trophy, Users, Edit, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Team {
  id: string;
  player1: string;
  player2: string;
}

interface Match {
  id: string;
  team1: Team | null;
  team2: Team | null;
  winner: Team | null;
  score1?: string;
  score2?: string;
  stage: "quarters" | "semis" | "final";
}

const Brackets = () => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("5-masculino");
  const [qualifiedCount, setQualifiedCount] = useState<number>(8);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [score1, setScore1] = useState<string>("");
  const [score2, setScore2] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const categories = [
    { value: "5-masculino", label: "5ta Masculino" },
    { value: "5-femenino", label: "5ta Femenino" },
    { value: "6-masculino", label: "6ta Masculino" },
    { value: "6-femenino", label: "6ta Femenino" },
    { value: "7-masculino", label: "7ta Masculino" },
    { value: "7-femenino", label: "7ta Femenino" },
  ];

  // Mock qualified teams
  const mockQualifiedTeams: Team[] = [
    { id: "1", player1: "Juan Pérez", player2: "Carlos López" },
    { id: "2", player1: "Pedro Martín", player2: "Luis Rodríguez" },
    { id: "3", player1: "Ana García", player2: "María González" },
    { id: "4", player1: "Laura Sánchez", player2: "Carmen Ruiz" },
    { id: "5", player1: "Miguel Torres", player2: "David Herrera" },
    { id: "6", player1: "Roberto Silva", player2: "Fernando Ruiz" },
    { id: "7", player1: "José Morales", player2: "Antonio Jiménez" },
    { id: "8", player1: "Cristina Vega", player2: "Isabel Ramos" },
  ];

  const [matches, setMatches] = useState<Match[]>([
    // Cuartos de final
    { id: "q1", team1: mockQualifiedTeams[0], team2: mockQualifiedTeams[7], winner: null, stage: "quarters" },
    { id: "q2", team1: mockQualifiedTeams[1], team2: mockQualifiedTeams[6], winner: null, stage: "quarters" },
    { id: "q3", team1: mockQualifiedTeams[2], team2: mockQualifiedTeams[5], winner: null, stage: "quarters" },
    { id: "q4", team1: mockQualifiedTeams[3], team2: mockQualifiedTeams[4], winner: null, stage: "quarters" },
    // Semifinales
    { id: "s1", team1: null, team2: null, winner: null, stage: "semis" },
    { id: "s2", team1: null, team2: null, winner: null, stage: "semis" },
    // Final
    { id: "f1", team1: null, team2: null, winner: null, stage: "final" },
  ]);

  const handleEditMatch = (match: Match) => {
    setEditingMatch(match);
    setScore1(match.score1 || "");
    setScore2(match.score2 || "");
    setIsDialogOpen(true);
  };

  const handleSaveMatch = () => {
    if (!editingMatch || !editingMatch.team1 || !editingMatch.team2) return;

    if (!score1.trim() || !score2.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa ambos marcadores",
        variant: "destructive",
      });
      return;
    }

    // Determinar ganador basado en marcador
    const winner = determineWinner(score1, score2, editingMatch.team1, editingMatch.team2);

    setMatches(prevMatches => {
      const updatedMatches = prevMatches.map(match => {
        if (match.id === editingMatch.id) {
          return {
            ...match,
            score1,
            score2,
            winner
          };
        }
        return match;
      });

      // Actualizar siguientes rondas si es necesario
      return updateNextRounds(updatedMatches, editingMatch.id, winner);
    });

    toast({
      title: "Resultado guardado",
      description: `${winner?.player1} y ${winner?.player2} clasifican a la siguiente ronda`,
    });

    setIsDialogOpen(false);
    setEditingMatch(null);
    setScore1("");
    setScore2("");
  };

  const determineWinner = (score1: string, score2: string, team1: Team, team2: Team): Team => {
    // Lógica simple: comparar puntuación final
    const sets1 = score1.split(' ').map(s => parseInt(s.split('-')[0] || '0'));
    const sets2 = score2.split(' ').map(s => parseInt(s.split('-')[1] || '0'));
    
    const setsWon1 = sets1.filter((score, i) => score > sets2[i]).length;
    const setsWon2 = sets2.filter((score, i) => score > sets1[i]).length;
    
    return setsWon1 > setsWon2 ? team1 : team2;
  };

  const updateNextRounds = (matches: Match[], matchId: string, winner: Team): Match[] => {
    // Actualizar semifinales desde cuartos
    if (matchId === "q1" || matchId === "q2") {
      const semifinalIndex = matches.findIndex(m => m.id === "s1");
      if (semifinalIndex !== -1) {
        matches[semifinalIndex] = {
          ...matches[semifinalIndex],
          [matchId === "q1" ? "team1" : "team2"]: winner
        };
      }
    }
    
    if (matchId === "q3" || matchId === "q4") {
      const semifinalIndex = matches.findIndex(m => m.id === "s2");
      if (semifinalIndex !== -1) {
        matches[semifinalIndex] = {
          ...matches[semifinalIndex],
          [matchId === "q3" ? "team1" : "team2"]: winner
        };
      }
    }

    // Actualizar final desde semifinales
    if (matchId === "s1" || matchId === "s2") {
      const finalIndex = matches.findIndex(m => m.id === "f1");
      if (finalIndex !== -1) {
        matches[finalIndex] = {
          ...matches[finalIndex],
          [matchId === "s1" ? "team1" : "team2"]: winner
        };
      }
    }

    return matches;
  };

  const renderMatch = (match: Match, title: string) => (
    <Card key={match.id} className="shadow-padel">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {match.team1 && match.team2 ? (
          <>
            <div className={`p-3 rounded-lg border-2 ${match.winner?.id === match.team1.id ? 'border-padel-gold bg-padel-gold-light' : 'border-border'}`}>
              <p className="font-semibold text-sm">{match.team1.player1}</p>
              <p className="text-xs text-muted-foreground">{match.team1.player2}</p>
              {match.score1 && <p className="text-xs font-mono mt-1">{match.score1}</p>}
            </div>
            
            <div className="text-center text-xs text-muted-foreground">VS</div>
            
            <div className={`p-3 rounded-lg border-2 ${match.winner?.id === match.team2.id ? 'border-padel-gold bg-padel-gold-light' : 'border-border'}`}>
              <p className="font-semibold text-sm">{match.team2.player1}</p>
              <p className="text-xs text-muted-foreground">{match.team2.player2}</p>
              {match.score2 && <p className="text-xs font-mono mt-1">{match.score2}</p>}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => handleEditMatch(match)}
            >
              <Edit className="h-3 w-3 mr-1" />
              {match.winner ? "Editar" : "Resultado"}
            </Button>
          </>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2" />
            <p className="text-xs">Esperando clasificados</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const quarterMatches = matches.filter(m => m.stage === "quarters");
  const semiMatches = matches.filter(m => m.stage === "semis");
  const finalMatch = matches.find(m => m.stage === "final");
  const champion = finalMatch?.winner;

  return (
    <div className="min-h-screen bg-padel-gradient">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Eliminatorias</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Category Selection */}
        <Card className="shadow-padel mb-8">
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Categoría</Label>
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
                <Label>Equipos clasificados</Label>
                <Select value={qualifiedCount.toString()} onValueChange={(value) => setQualifiedCount(Number(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4 equipos</SelectItem>
                    <SelectItem value="8">8 equipos</SelectItem>
                    <SelectItem value="16">16 equipos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Champion Display */}
        {champion && (
          <Card className="shadow-padel-lg mb-8 bg-padel-gold-light border-padel-gold">
            <CardContent className="text-center py-8">
              <Crown className="h-12 w-12 mx-auto mb-4 text-padel-gold" />
              <h2 className="text-2xl font-bold mb-2">¡Campeones!</h2>
              <div className="text-lg">
                <p className="font-semibold">{champion.player1}</p>
                <p className="text-muted-foreground">{champion.player2}</p>
              </div>
              <Badge className="mt-4 bg-padel-gold text-primary">
                🏆 Campeones {categories.find(c => c.value === selectedCategory)?.label}
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* Brackets */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Cuartos de Final */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Cuartos de Final</h3>
            {quarterMatches.map((match, index) => 
              renderMatch(match, `Cuarto ${index + 1}`)
            )}
          </div>

          {/* Semifinales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Semifinales</h3>
            {semiMatches.map((match, index) => 
              renderMatch(match, `Semifinal ${index + 1}`)
            )}
          </div>

          {/* Final */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Final</h3>
            {finalMatch && renderMatch(finalMatch, "Final")}
          </div>

          {/* Campeón */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Campeón</h3>
            <Card className="shadow-padel">
              <CardContent className="text-center py-8">
                {champion ? (
                  <>
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-padel-gold" />
                    <p className="font-bold">{champion.player1}</p>
                    <p className="text-sm text-muted-foreground">{champion.player2}</p>
                  </>
                ) : (
                  <>
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Por determinar</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Match Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Resultado</DialogTitle>
            </DialogHeader>
            {editingMatch && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{editingMatch.team1?.player1} / {editingMatch.team1?.player2}</Label>
                    <Input
                      value={score1}
                      onChange={(e) => setScore1(e.target.value)}
                      placeholder="ej: 6-4 6-2"
                    />
                  </div>
                  <div>
                    <Label>{editingMatch.team2?.player1} / {editingMatch.team2?.player2}</Label>
                    <Input
                      value={score2}
                      onChange={(e) => setScore2(e.target.value)}
                      placeholder="ej: 4-6 2-6"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveMatch}>
                    Guardar Resultado
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Brackets;