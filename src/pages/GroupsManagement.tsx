import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Shuffle, Users, Settings, Move } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Team {
  id: string;
  player1: string;
  player2: string;
  category: string;
}

interface Group {
  id: string;
  name: string;
  teams: Team[];
}

const GroupsManagement = () => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [groupSize, setGroupSize] = useState<number>(4);
  const [numberOfGroups, setNumberOfGroups] = useState<number>(2);
  const [groups, setGroups] = useState<Group[]>([]);
  
  // Mock data - en producción vendrá de Supabase
  const mockTeams: Team[] = [
    { id: "1", player1: "Juan Pérez", player2: "Carlos López", category: "5-masculino" },
    { id: "2", player1: "Ana García", player2: "María González", category: "5-femenino" },
    { id: "3", player1: "Pedro Martín", player2: "Luis Rodríguez", category: "5-masculino" },
    { id: "4", player1: "Laura Sánchez", player2: "Carmen Ruiz", category: "5-femenino" },
  ];

  const categories = [
    { value: "5-masculino", label: "5ta Masculino" },
    { value: "5-femenino", label: "5ta Femenino" },
    { value: "6-masculino", label: "6ta Masculino" },
    { value: "6-femenino", label: "6ta Femenino" },
    { value: "7-masculino", label: "7ta Masculino" },
    { value: "7-femenino", label: "7ta Femenino" },
  ];

  const generateRandomGroups = () => {
    if (!selectedCategory) {
      toast({
        title: "Error",
        description: "Selecciona una categoría primero",
        variant: "destructive",
      });
      return;
    }

    const categoryTeams = mockTeams.filter(team => team.category === selectedCategory);
    
    if (categoryTeams.length === 0) {
      toast({
        title: "Sin equipos",
        description: "No hay equipos registrados en esta categoría",
        variant: "destructive",
      });
      return;
    }

    // Mezclar equipos aleatoriamente
    const shuffledTeams = [...categoryTeams].sort(() => Math.random() - 0.5);
    const newGroups: Group[] = [];

    for (let i = 0; i < numberOfGroups; i++) {
      const group: Group = {
        id: `group-${i + 1}`,
        name: `Grupo ${String.fromCharCode(65 + i)}`, // A, B, C, etc.
        teams: []
      };

      // Distribuir equipos entre grupos
      for (let j = i; j < shuffledTeams.length; j += numberOfGroups) {
        if (group.teams.length < groupSize && shuffledTeams[j]) {
          group.teams.push(shuffledTeams[j]);
        }
      }

      newGroups.push(group);
    }

    setGroups(newGroups);
    toast({
      title: "Grupos generados",
      description: `Se han creado ${numberOfGroups} grupos aleatoriamente`,
    });
  };

  const moveTeam = (teamId: string, fromGroupId: string, toGroupId: string) => {
    if (fromGroupId === toGroupId) return;

    setGroups(prevGroups => {
      const updatedGroups = prevGroups.map(group => {
        if (group.id === fromGroupId) {
          return {
            ...group,
            teams: group.teams.filter(team => team.id !== teamId)
          };
        }
        if (group.id === toGroupId) {
          const teamToMove = prevGroups
            .find(g => g.id === fromGroupId)
            ?.teams.find(t => t.id === teamId);
          
          if (teamToMove && group.teams.length < groupSize) {
            return {
              ...group,
              teams: [...group.teams, teamToMove]
            };
          }
        }
        return group;
      });
      
      return updatedGroups;
    });

    toast({
      title: "Equipo movido",
      description: "El equipo ha sido movido exitosamente",
    });
  };

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
              <Users className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Gestión de Grupos</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Configuration Panel */}
        <Card className="shadow-padel mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración de Grupos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
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
                <Label htmlFor="groupSize">Equipos por grupo</Label>
                <Input
                  id="groupSize"
                  type="number"
                  min="2"
                  max="8"
                  value={groupSize}
                  onChange={(e) => setGroupSize(Number(e.target.value))}
                />
              </div>
              
              <div>
                <Label htmlFor="numberOfGroups">Número de grupos</Label>
                <Input
                  id="numberOfGroups"
                  type="number"
                  min="1"
                  max="8"
                  value={numberOfGroups}
                  onChange={(e) => setNumberOfGroups(Number(e.target.value))}
                />
              </div>
              
              <div className="flex items-end">
                <Button onClick={generateRandomGroups} className="w-full">
                  <Shuffle className="h-4 w-4 mr-2" />
                  Generar Grupos
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Groups Display */}
        {groups.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <Card key={group.id} className="shadow-padel">
                <CardHeader>
                  <CardTitle className="text-center">{group.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {group.teams.map((team, index) => (
                      <div 
                        key={team.id}
                        className="p-3 bg-muted rounded-lg border-l-4 border-primary"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">#{index + 1}</p>
                            <p className="font-semibold">{team.player1}</p>
                            <p className="text-muted-foreground">{team.player2}</p>
                          </div>
                          <Select 
                            onValueChange={(value) => moveTeam(team.id, group.id, value)}
                          >
                            <SelectTrigger className="w-20 h-8">
                              <Move className="h-3 w-3" />
                            </SelectTrigger>
                            <SelectContent>
                              {groups
                                .filter(g => g.id !== group.id)
                                .map(g => (
                                  <SelectItem 
                                    key={g.id} 
                                    value={g.id}
                                    disabled={g.teams.length >= groupSize}
                                  >
                                    {g.name}
                                  </SelectItem>
                                ))
                              }
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                    
                    {group.teams.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        Grupo vacío
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {groups.length === 0 && (
          <Card className="shadow-padel">
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay grupos generados</h3>
              <p className="text-muted-foreground">
                Configura los parámetros y genera los grupos para comenzar
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default GroupsManagement;