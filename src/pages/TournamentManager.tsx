import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Plus, Trash2, Settings, Play, Save, Edit, Shuffle, Trophy, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTeams, useCategories } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import tournamentLogo from "@/assets/white-padel-tournament-logo.png";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface Team {
  id: string;
  name: string;
  player1_name: string;
  player2_name: string;
  category: string;
}

interface Group {
  id: string;
  name: string;
  teams: Team[];
  matchesPerTeam: number;
}

interface Match {
  id: string;
  group_id: string;
  team1: Team | null;
  team2: Team | null;
  team1_set1: number;
  team1_set2: number | null;
  team1_set3: number | null;
  team2_set1: number;
  team2_set2: number | null;
  team2_set3: number | null;
  winner_id: string | null;
  status: 'pending' | 'in_progress' | 'completed';
}

const TournamentManager = () => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("Masculino");
  const [groups, setGroups] = useState<Group[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [numberOfGroups, setNumberOfGroups] = useState(2);
  const [matchesPerTeam, setMatchesPerTeam] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Match editing
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [isAddMatchDialogOpen, setIsAddMatchDialogOpen] = useState(false);
  const [selectedGroupForMatch, setSelectedGroupForMatch] = useState<string>("");
  const [newMatchTeam1, setNewMatchTeam1] = useState<string>("");
  const [newMatchTeam2, setNewMatchTeam2] = useState<string>("");

  const { data: categories } = useCategories();
  const { data: allTeams } = useTeams(selectedCategory);
  const { data: masculinoTeams } = useTeams("Masculino");
  const { data: femeninoTeams } = useTeams("Femenino");

  // Cargar grupos y partidos existentes cuando se selecciona una categoría
  useEffect(() => {
    if (selectedCategory) {
      loadGroupsAndMatches();
    }
  }, [selectedCategory]);

  const loadGroupsAndMatches = async () => {
    try {
      // Cargar grupos
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select(`
          id,
          name,
          group_teams (
            teams (*)
          )
        `)
        .eq('category', selectedCategory);

      if (groupsError) throw groupsError;

      // Transformar datos
      const loadedGroups: Group[] = groupsData?.map((g: any) => ({
        id: g.id,
        name: g.name,
        teams: g.group_teams?.map((gt: any) => gt.teams) || [],
        matchesPerTeam: 0
      })) || [];

      setGroups(loadedGroups);

      // Cargar partidos
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
          id,
          group_id,
          team1_id,
          team2_id,
          team1_set1,
          team1_set2,
          team1_set3,
          team2_set1,
          team2_set2,
          team2_set3,
          winner_id,
          status,
          team1:teams!matches_team1_id_fkey (*),
          team2:teams!matches_team2_id_fkey (*)
        `)
        .eq('category', selectedCategory)
        .eq('phase', 'group');

      if (matchesError) throw matchesError;

      const loadedMatches: Match[] = matchesData?.map((m: any) => ({
        id: m.id,
        group_id: m.group_id,
        team1: m.team1,
        team2: m.team2,
        team1_set1: m.team1_set1 || 0,
        team1_set2: m.team1_set2,
        team1_set3: m.team1_set3,
        team2_set1: m.team2_set1 || 0,
        team2_set2: m.team2_set2,
        team2_set3: m.team2_set3,
        winner_id: m.winner_id,
        status: m.status
      })) || [];

      setMatches(loadedMatches);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive"
      });
    }
  };

  // Generar configuración de grupos
  const handleGenerateGroups = () => {
    if (!allTeams || allTeams.length === 0) {
      toast({
        title: "Error",
        description: "No hay equipos para generar grupos",
        variant: "destructive"
      });
      return;
    }

    // Mezclar equipos
    const shuffledTeams = [...allTeams].sort(() => Math.random() - 0.5);
    const teamsPerGroup = Math.ceil(shuffledTeams.length / numberOfGroups);

    const newGroups: Group[] = [];
    for (let i = 0; i < numberOfGroups; i++) {
      const groupTeams = shuffledTeams.slice(i * teamsPerGroup, (i + 1) * teamsPerGroup);
      if (groupTeams.length > 0) {
        newGroups.push({
          id: `temp-${i}`,
          name: `Grupo ${String.fromCharCode(65 + i)}`,
          teams: groupTeams,
          matchesPerTeam: 0
        });
      }
    }

    setGroups(newGroups);
    setIsConfigDialogOpen(false);

    toast({
      title: "Grupos generados",
      description: `Se crearon ${newGroups.length} grupos. Ajusta las duplas si es necesario.`
    });
  };

  // Generar partidos para cada grupo
  const generateMatches = () => {
    const newMatches: Match[] = [];
    let totalUnassigned = 0;

    groups.forEach(group => {
      const teamMatchCount: Record<string, number> = {};
      const availableOpponents: Record<string, string[]> = {};

      // Inicializar contadores
      group.teams.forEach(team => {
        teamMatchCount[team.id] = 0;
        availableOpponents[team.id] = group.teams.filter(t => t.id !== team.id).map(t => t.id);
      });

      // Generar partidos asegurando que cada equipo juegue matchesPerTeam partidos
      const shuffledTeams = [...group.teams].sort(() => Math.random() - 0.5);

      shuffledTeams.forEach(team1 => {
        while (teamMatchCount[team1.id] < matchesPerTeam && availableOpponents[team1.id].length > 0) {
          // Buscar oponente que también necesite partidos
          const potentialOpponents = availableOpponents[team1.id].filter(oppId =>
            teamMatchCount[oppId] < matchesPerTeam &&
            availableOpponents[oppId].includes(team1.id)
          );

          if (potentialOpponents.length > 0) {
            // Seleccionar oponente aleatorio
            const opponentId = potentialOpponents[Math.floor(Math.random() * potentialOpponents.length)];
            const team2 = group.teams.find(t => t.id === opponentId);

            if (team2) {
              newMatches.push({
                id: `temp-${group.id}-${team1.id}-${opponentId}-${Date.now()}`,
                group_id: group.id,
                team1: team1,
                team2: team2,
                team1_set1: 0,
                team1_set2: null,
                team1_set3: null,
                team2_set1: 0,
                team2_set2: null,
                team2_set3: null,
                winner_id: null,
                status: 'pending'
              });

              teamMatchCount[team1.id]++;
              teamMatchCount[opponentId]++;

              // Remover de disponibles para evitar duplicados
              availableOpponents[team1.id] = availableOpponents[team1.id].filter(id => id !== opponentId);
              availableOpponents[opponentId] = availableOpponents[opponentId].filter(id => id !== team1.id);
            }
          } else {
            break; // No hay oponentes disponibles
          }
        }
      });

      // Crear partidos sin asignar para equipos que no completaron sus partidos
      group.teams.forEach(team => {
        const remainingMatches = matchesPerTeam - teamMatchCount[team.id];
        for (let i = 0; i < remainingMatches; i++) {
          newMatches.push({
            id: `temp-unassigned-${group.id}-${team.id}-${i}-${Date.now()}`,
            group_id: group.id,
            team1: team,
            team2: null, // Sin asignar
            team1_set1: 0,
            team1_set2: null,
            team1_set3: null,
            team2_set1: 0,
            team2_set2: null,
            team2_set3: null,
            winner_id: null,
            status: 'pending'
          });
          totalUnassigned++;
        }
      });
    });

    setMatches(newMatches);

    toast({
      title: "Partidos generados",
      description: totalUnassigned > 0
        ? `Se generaron ${newMatches.length} partidos. ${totalUnassigned} partido(s) sin contrincante asignado.`
        : `Se generaron ${newMatches.length} partidos correctamente`
    });
  };

  // Guardar todo en la base de datos
  const handleSaveAll = async () => {
    if (!selectedCategory) {
      toast({
        title: "Error",
        description: "Selecciona una categoría",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      // 1. Eliminar grupos y partidos existentes de esta categoría
      await supabase.from('matches').delete().eq('category', selectedCategory).eq('phase', 'group');
      await supabase.from('group_teams').delete().in('group_id',
        (await supabase.from('groups').select('id').eq('category', selectedCategory)).data?.map(g => g.id) || []
      );
      await supabase.from('standings').delete().in('group_id',
        (await supabase.from('groups').select('id').eq('category', selectedCategory)).data?.map(g => g.id) || []
      );
      await supabase.from('groups').delete().eq('category', selectedCategory);

      // 2. Crear nuevos grupos
      const groupIdMapping: Record<string, string> = {};

      for (const group of groups) {
        const { data: newGroup, error: groupError } = await supabase
          .from('groups')
          .insert({
            name: group.name,
            category: selectedCategory
          })
          .select()
          .single();

        if (groupError) throw groupError;

        groupIdMapping[group.id] = newGroup.id;

        // 3. Agregar equipos al grupo
        for (const team of group.teams) {
          await supabase.from('group_teams').insert({
            group_id: newGroup.id,
            team_id: team.id
          });

          // 4. Crear entrada en standings
          await supabase.from('standings').insert({
            group_id: newGroup.id,
            team_id: team.id,
            played: 0,
            won: 0,
            lost: 0,
            sets_won: 0,
            sets_lost: 0,
            games_won: 0,
            games_lost: 0,
            points: 0
          });
        }
      }

      // 5. Crear partidos (solo los que tienen ambos equipos asignados)
      for (const match of matches) {
        // Solo guardar partidos con ambos equipos asignados
        if (match.team1 && match.team2) {
          const realGroupId = groupIdMapping[match.group_id];

          await supabase.from('matches').insert({
            category: selectedCategory,
            phase: 'group',
            group_id: realGroupId,
            team1_id: match.team1.id,
            team2_id: match.team2.id,
            team1_set1: match.team1_set1,
            team1_set2: match.team1_set2,
            team1_set3: match.team1_set3,
            team2_set1: match.team2_set1,
            team2_set2: match.team2_set2,
            team2_set3: match.team2_set3,
            winner_id: match.winner_id,
            status: match.status
          });
        }
      }

      const unassignedMatches = matches.filter(m => !m.team2).length;
      if (unassignedMatches > 0) {
        toast({
          title: "Advertencia",
          description: `${unassignedMatches} partido(s) sin contrincante no fueron guardados. Asigna los contrincantes y guarda nuevamente.`,
          variant: "destructive"
        });
      }

      toast({
        title: "¡Guardado exitoso!",
        description: "Todos los grupos y partidos se guardaron correctamente"
      });

      // Recargar datos
      await loadGroupsAndMatches();
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar. Verifica los datos.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Drag and drop para mover equipos entre grupos
  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    const sourceGroupIndex = parseInt(source.droppableId);
    const destGroupIndex = parseInt(destination.droppableId);

    if (sourceGroupIndex === destGroupIndex && source.index === destination.index) {
      return;
    }

    const newGroups = [...groups];
    const sourceGroup = newGroups[sourceGroupIndex];
    const destGroup = newGroups[destGroupIndex];

    const [movedTeam] = sourceGroup.teams.splice(source.index, 1);
    destGroup.teams.splice(destination.index, 0, movedTeam);

    setGroups(newGroups);
  };

  // Editar resultado de partido
  const handleEditMatch = (match: Match) => {
    setEditingMatch(match);
    setIsMatchDialogOpen(true);
  };

  const handleSaveMatch = async () => {
    if (!editingMatch || !editingMatch.team1 || !editingMatch.team2) return;

    // Auto-calcular ganador antes de guardar
    const team1Sets = [
      editingMatch.team1_set1 > editingMatch.team2_set1 ? 1 : 0,
      editingMatch.team1_set2 !== null && editingMatch.team2_set2 !== null
        ? (editingMatch.team1_set2 > editingMatch.team2_set2 ? 1 : 0)
        : 0,
      editingMatch.team1_set3 !== null && editingMatch.team2_set3 !== null
        ? (editingMatch.team1_set3 > editingMatch.team2_set3 ? 1 : 0)
        : 0
    ].reduce((a, b) => a + b, 0);

    const team2Sets = [
      editingMatch.team2_set1 > editingMatch.team1_set1 ? 1 : 0,
      editingMatch.team2_set2 !== null && editingMatch.team1_set2 !== null
        ? (editingMatch.team2_set2 > editingMatch.team1_set2 ? 1 : 0)
        : 0,
      editingMatch.team2_set3 !== null && editingMatch.team1_set3 !== null
        ? (editingMatch.team2_set3 > editingMatch.team1_set3 ? 1 : 0)
        : 0
    ].reduce((a, b) => a + b, 0);

    let updatedMatch = { ...editingMatch };

    // Determinar ganador (puede ganar con 1 set si solo se jugó 1 set)
    const totalSets = (editingMatch.team1_set2 !== null ? 1 : 0) +
                      (editingMatch.team1_set3 !== null ? 1 : 0) + 1; // +1 por set 1 que es obligatorio
    const setsToWin = Math.ceil(totalSets / 2);

    if (team1Sets >= setsToWin) {
      updatedMatch.winner_id = editingMatch.team1.id;
      updatedMatch.status = 'completed';
    } else if (team2Sets >= setsToWin) {
      updatedMatch.winner_id = editingMatch.team2.id;
      updatedMatch.status = 'completed';
    } else {
      updatedMatch.winner_id = null;
      updatedMatch.status = 'pending';
    }

    try {
      // Guardar en la base de datos inmediatamente
      if (updatedMatch.id.startsWith('temp-')) {
        // Es un partido nuevo que aún no está en la DB
        toast({
          title: "Error",
          description: "Este partido aún no está guardado. Usa 'Guardar Todo' primero.",
          variant: "destructive"
        });
        return;
      }

      // Actualizar el partido en la base de datos
      const { error } = await supabase
        .from('matches')
        .update({
          team1_id: updatedMatch.team1.id,
          team2_id: updatedMatch.team2.id,
          team1_set1: updatedMatch.team1_set1,
          team1_set2: updatedMatch.team1_set2,
          team1_set3: updatedMatch.team1_set3,
          team2_set1: updatedMatch.team2_set1,
          team2_set2: updatedMatch.team2_set2,
          team2_set3: updatedMatch.team2_set3,
          winner_id: updatedMatch.winner_id,
          status: updatedMatch.status
        })
        .eq('id', updatedMatch.id);

      if (error) throw error;

      // Actualizar el estado local
      const updatedMatches = matches.map(m =>
        m.id === updatedMatch.id ? updatedMatch : m
      );

      setMatches(updatedMatches);
      setIsMatchDialogOpen(false);
      setEditingMatch(null);

      toast({
        title: "Partido guardado",
        description: updatedMatch.status === 'completed'
          ? `Ganador: ${updatedMatch.winner_id === updatedMatch.team1.id ? updatedMatch.team1.name : updatedMatch.team2.name}`
          : "Resultado guardado en la base de datos"
      });
    } catch (error) {
      console.error("Error saving match:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el partido. Intenta nuevamente.",
        variant: "destructive"
      });
    }
  };

  // Agregar nuevo partido manualmente
  const handleAddMatch = () => {
    if (!newMatchTeam1 || !newMatchTeam2 || !selectedGroupForMatch) {
      toast({
        title: "Error",
        description: "Selecciona ambos equipos y un grupo",
        variant: "destructive"
      });
      return;
    }

    if (newMatchTeam1 === newMatchTeam2) {
      toast({
        title: "Error",
        description: "Los equipos deben ser diferentes",
        variant: "destructive"
      });
      return;
    }

    const team1 = allTeams?.find(t => t.id === newMatchTeam1);
    const team2 = allTeams?.find(t => t.id === newMatchTeam2);

    if (!team1 || !team2) return;

    const newMatch: Match = {
      id: `temp-manual-${Date.now()}`,
      group_id: selectedGroupForMatch,
      team1,
      team2,
      team1_set1: 0,
      team1_set2: null,
      team1_set3: null,
      team2_set1: 0,
      team2_set2: null,
      team2_set3: null,
      winner_id: null,
      status: 'pending'
    };

    setMatches([...matches, newMatch]);
    setIsAddMatchDialogOpen(false);
    setNewMatchTeam1("");
    setNewMatchTeam2("");

    toast({
      title: "Partido agregado",
      description: "El partido se agregó correctamente"
    });
  };

  // Eliminar partido
  const handleDeleteMatch = (matchId: string) => {
    setMatches(matches.filter(m => m.id !== matchId));
    toast({
      title: "Partido eliminado",
      description: "El partido se eliminó de la lista"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Volver</span>
                </Button>
              </Link>
              <div className="h-8 w-px bg-border hidden sm:block" />
              <div>
                <h1 className="text-base sm:text-xl font-bold">Gestor de Torneo</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Configura grupos y partidos fácilmente</p>
              </div>
            </div>
            <img src={tournamentLogo} alt="White Padel" className="h-8 sm:h-10 w-auto" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-8 max-w-7xl">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="Masculino" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Masculino</span>
              <span className="sm:hidden">Masc</span>
            </TabsTrigger>
            <TabsTrigger value="Femenino" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Femenino</span>
              <span className="sm:hidden">Fem</span>
            </TabsTrigger>
          </TabsList>

          {/* Mostrar número de duplas debajo de las pestañas */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {selectedCategory === "Masculino" 
                ? `${masculinoTeams?.length || 0} duplas registradas`
                : `${femeninoTeams?.length || 0} duplas registradas`}
            </p>
          </div>

          <TabsContent value="Masculino" className="space-y-6">
            {/* Contenido de Masculino */}
            {/* Configuración de grupos */}
            <Card className="mb-4 sm:mb-6">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                  <div>
                    <CardTitle className="text-base sm:text-lg">2. Configurar Grupos</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Define los grupos y distribuye las duplas</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <Settings className="h-4 w-4" />
                          Configurar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Configuración de Grupos</DialogTitle>
                          <DialogDescription>
                            Ajusta el número de grupos y genera la distribución automática
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>Número de grupos</Label>
                            <Input
                              type="number"
                              min="2"
                              max="8"
                              value={numberOfGroups}
                              onChange={(e) => setNumberOfGroups(Number(e.target.value))}
                            />
                          </div>
                          <div className="rounded-lg bg-muted p-3">
                            <p className="text-sm">
                              {allTeams?.length || 0} duplas ÷ {numberOfGroups} grupos = ~{Math.ceil((allTeams?.length || 0) / numberOfGroups)} duplas por grupo
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleGenerateGroups} className="gap-2">
                            <Shuffle className="h-4 w-4" />
                            Generar
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {groups.length > 0 && (
                      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Label className="text-xs sm:text-sm whitespace-nowrap">Partidos por dupla:</Label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={matchesPerTeam}
                            onChange={(e) => setMatchesPerTeam(Number(e.target.value))}
                            className="w-16 sm:w-20"
                          />
                        </div>
                        <Button onClick={generateMatches} className="gap-2 w-full sm:w-auto">
                          <Play className="h-4 w-4" />
                          <span className="hidden sm:inline">Generar Partidos</span>
                          <span className="sm:hidden">Generar</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {groups.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">No hay grupos configurados</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Haz clic en "Configurar" para generar los grupos automáticamente
                    </p>
                  </div>
                ) : (
                  <DragDropContext onDragEnd={onDragEnd}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {groups.map((group, groupIndex) => (
                        <Card key={group.id}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">{group.name}</CardTitle>
                            <CardDescription>{group.teams.length} duplas</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Droppable droppableId={groupIndex.toString()}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className={`space-y-2 min-h-[100px] p-2 rounded-lg transition-colors ${
                                    snapshot.isDraggingOver ? 'bg-muted' : ''
                                  }`}
                                >
                                  {group.teams.map((team, index) => (
                                    <Draggable key={team.id} draggableId={team.id} index={index}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className={`p-3 rounded-lg border bg-card transition-all ${
                                            snapshot.isDragging ? 'shadow-lg ring-2 ring-primary' : ''
                                          }`}
                                        >
                                          <p className="font-semibold text-sm">{team.name}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {team.player1_name} / {team.player2_name}
                                          </p>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </DragDropContext>
                )}
              </CardContent>
            </Card>

            {/* Partidos */}
            {matches.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>3. Partidos Generados</CardTitle>
                      <CardDescription>Revisa, edita, agrega o elimina partidos</CardDescription>
                    </div>
                    <Dialog open={isAddMatchDialogOpen} onOpenChange={setIsAddMatchDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2">
                          <Plus className="h-4 w-4" />
                          Agregar Partido
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Agregar Nuevo Partido</DialogTitle>
                          <DialogDescription>
                            Selecciona el grupo y los equipos que jugarán
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>Grupo</Label>
                            <Select value={selectedGroupForMatch} onValueChange={setSelectedGroupForMatch}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar grupo" />
                              </SelectTrigger>
                              <SelectContent>
                                {groups.map(group => (
                                  <SelectItem key={group.id} value={group.id}>
                                    {group.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Equipo 1</Label>
                            <Select value={newMatchTeam1} onValueChange={setNewMatchTeam1}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar equipo" />
                              </SelectTrigger>
                              <SelectContent>
                                {allTeams?.map(team => (
                                  <SelectItem key={team.id} value={team.id}>
                                    {team.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Equipo 2</Label>
                            <Select value={newMatchTeam2} onValueChange={setNewMatchTeam2}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar equipo" />
                              </SelectTrigger>
                              <SelectContent>
                                {allTeams?.filter(t => t.id !== newMatchTeam1).map(team => (
                                  <SelectItem key={team.id} value={team.id}>
                                    {team.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsAddMatchDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleAddMatch}>
                            Agregar
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue={groups[0]?.id}>
                    <TabsList className="mb-4">
                      {groups.map(group => (
                        <TabsTrigger key={group.id} value={group.id}>
                          {group.name} ({matches.filter(m => m.group_id === group.id).length} partidos)
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {groups.map(group => (
                      <TabsContent key={group.id} value={group.id}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          {matches
                            .filter(m => m.group_id === group.id)
                            .map((match, index) => (
                              <Card
                                key={match.id}
                                className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                              >
                                <CardHeader className="pb-2 sm:pb-3">
                                  <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-xs">Partido #{index + 1}</Badge>
                                    <Badge variant={match.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                                      <span className="hidden sm:inline">{match.status === 'completed' ? 'Completado' : 'Pendiente'}</span>
                                      <span className="sm:hidden">{match.status === 'completed' ? '✓' : '○'}</span>
                                    </Badge>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-2 sm:space-y-3">
                                  {/* Equipo 1 */}
                                  {match.team1 && (
                                    <div className="p-2 sm:p-3 rounded-lg bg-muted/50 border">
                                      <p className="font-semibold text-xs sm:text-sm mb-1 truncate">{match.team1.name}</p>
                                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                        {match.team1.player1_name} / {match.team1.player2_name}
                                      </p>
                                    </div>
                                  )}

                                  {/* Equipo 2 o Selector */}
                                  {match.team2 ? (
                                    <>
                                      {/* VS y Marcador */}
                                      <div className="flex items-center justify-center gap-1 sm:gap-2 py-1 sm:py-2">
                                        <div className="text-center">
                                          <p className="text-xs text-muted-foreground mb-1">Set 1</p>
                                          <div className="flex gap-1 text-sm font-bold">
                                            <span className={match.team1_set1 > match.team2_set1 ? 'text-primary' : ''}>
                                              {match.team1_set1}
                                            </span>
                                            <span>-</span>
                                            <span className={match.team2_set1 > match.team1_set1 ? 'text-primary' : ''}>
                                              {match.team2_set1}
                                            </span>
                                          </div>
                                        </div>
                                        {match.team1_set2 !== null && match.team2_set2 !== null && (
                                          <>
                                            <div className="h-8 w-px bg-border" />
                                            <div className="text-center">
                                              <p className="text-xs text-muted-foreground mb-1">Set 2</p>
                                              <div className="flex gap-1 text-sm font-bold">
                                                <span className={match.team1_set2 > match.team2_set2 ? 'text-primary' : ''}>
                                                  {match.team1_set2}
                                                </span>
                                                <span>-</span>
                                                <span className={match.team2_set2 > match.team1_set2 ? 'text-primary' : ''}>
                                                  {match.team2_set2}
                                                </span>
                                              </div>
                                            </div>
                                          </>
                                        )}
                                        {match.team1_set3 !== null && match.team2_set3 !== null && (
                                          <>
                                            <div className="h-8 w-px bg-border" />
                                            <div className="text-center">
                                              <p className="text-xs text-muted-foreground mb-1">Set 3</p>
                                              <div className="flex gap-1 text-sm font-bold">
                                                <span className={match.team1_set3 > match.team2_set3 ? 'text-primary' : ''}>
                                                  {match.team1_set3}
                                                </span>
                                                <span>-</span>
                                                <span className={match.team2_set3 > match.team1_set3 ? 'text-primary' : ''}>
                                                  {match.team2_set3}
                                                </span>
                                              </div>
                                            </div>
                                          </>
                                        )}
                                      </div>

                                      {/* Equipo 2 */}
                                      <div className="p-2 sm:p-3 rounded-lg bg-muted/50 border">
                                        <p className="font-semibold text-xs sm:text-sm mb-1 truncate">{match.team2.name}</p>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                          {match.team2.player1_name} / {match.team2.player2_name}
                                        </p>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-center py-2">
                                        <span className="text-2xl font-bold text-muted-foreground">VS</span>
                                      </div>
                                      <div className="p-3 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50">
                                        <Label className="text-xs text-muted-foreground mb-2 block">
                                          Seleccionar contrincante
                                        </Label>
                                        <Select
                                          value={match.team2?.id || ""}
                                          onValueChange={(value) => {
                                            const selectedTeam = group.teams.find(t => t.id === value);
                                            if (selectedTeam) {
                                              const updatedMatches = matches.map(m =>
                                                m.id === match.id ? { ...m, team2: selectedTeam } : m
                                              );
                                              setMatches(updatedMatches);
                                            }
                                          }}
                                        >
                                          <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Seleccionar dupla..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {group.teams
                                              .filter(t => t.id !== match.team1?.id)
                                              .map(team => (
                                                <SelectItem key={team.id} value={team.id}>
                                                  {team.name}
                                                </SelectItem>
                                              ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  )}

                                  {/* Botones de acción */}
                                  <div className="flex gap-2 pt-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1"
                                      onClick={() => handleEditMatch(match)}
                                    >
                                      <Edit className="h-3 w-3 mr-1" />
                                      Editar
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteMatch(match.id)}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* Botón de guardar */}
            {groups.length > 0 && (
              <div className="flex justify-end">
                <Button
                  size="lg"
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="gap-2"
                >
                  {isSaving ? (
                    <>Guardando...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Guardar Todo
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="Femenino" className="space-y-6">
            {/* Mismo contenido para Femenino */}
            {/* Configuración de grupos */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>1. Configurar Grupos</CardTitle>
                    <CardDescription>Define los grupos y distribuye las duplas</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <Settings className="h-4 w-4" />
                          Configurar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Configuración de Grupos</DialogTitle>
                          <DialogDescription>
                            Ajusta el número de grupos y genera la distribución automática
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>Número de grupos</Label>
                            <Input
                              type="number"
                              min="2"
                              max="8"
                              value={numberOfGroups}
                              onChange={(e) => setNumberOfGroups(Number(e.target.value))}
                            />
                          </div>
                          <div className="rounded-lg bg-muted p-3">
                            <p className="text-sm">
                              {allTeams?.length || 0} duplas ÷ {numberOfGroups} grupos = ~{Math.ceil((allTeams?.length || 0) / numberOfGroups)} duplas por grupo
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleGenerateGroups} className="gap-2">
                            <Shuffle className="h-4 w-4" />
                            Generar
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {groups.length > 0 && (
                      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Label className="text-xs sm:text-sm whitespace-nowrap">Partidos por dupla:</Label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={matchesPerTeam}
                            onChange={(e) => setMatchesPerTeam(Number(e.target.value))}
                            className="w-16 sm:w-20"
                          />
                        </div>
                        <Button onClick={generateMatches} className="gap-2 w-full sm:w-auto">
                          <Play className="h-4 w-4" />
                          <span className="hidden sm:inline">Generar Partidos</span>
                          <span className="sm:hidden">Generar</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {groups.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">No hay grupos configurados</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Haz clic en "Configurar" para generar los grupos automáticamente
                    </p>
                  </div>
                ) : (
                  <DragDropContext onDragEnd={onDragEnd}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {groups.map((group, groupIndex) => (
                        <Card key={group.id}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">{group.name}</CardTitle>
                            <CardDescription>{group.teams.length} duplas</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Droppable droppableId={groupIndex.toString()}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className={`space-y-2 min-h-[100px] p-2 rounded-lg transition-colors ${
                                    snapshot.isDraggingOver ? 'bg-muted' : ''
                                  }`}
                                >
                                  {group.teams.map((team, index) => (
                                    <Draggable key={team.id} draggableId={team.id} index={index}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className={`p-3 rounded-lg border bg-card transition-all ${
                                            snapshot.isDragging ? 'shadow-lg ring-2 ring-primary' : ''
                                          }`}
                                        >
                                          <p className="font-semibold text-sm">{team.name}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {team.player1_name} / {team.player2_name}
                                          </p>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </DragDropContext>
                )}
              </CardContent>
            </Card>

            {/* Partidos */}
            {matches.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>2. Partidos Generados</CardTitle>
                      <CardDescription>Revisa, edita, agrega o elimina partidos</CardDescription>
                    </div>
                    <Dialog open={isAddMatchDialogOpen} onOpenChange={setIsAddMatchDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2">
                          <Plus className="h-4 w-4" />
                          Agregar Partido
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Agregar Nuevo Partido</DialogTitle>
                          <DialogDescription>
                            Selecciona el grupo y los equipos que jugarán
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>Grupo</Label>
                            <Select value={selectedGroupForMatch} onValueChange={setSelectedGroupForMatch}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar grupo" />
                              </SelectTrigger>
                              <SelectContent>
                                {groups.map(group => (
                                  <SelectItem key={group.id} value={group.id}>
                                    {group.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Equipo 1</Label>
                            <Select value={newMatchTeam1} onValueChange={setNewMatchTeam1}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar equipo" />
                              </SelectTrigger>
                              <SelectContent>
                                {allTeams?.map(team => (
                                  <SelectItem key={team.id} value={team.id}>
                                    {team.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Equipo 2</Label>
                            <Select value={newMatchTeam2} onValueChange={setNewMatchTeam2}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar equipo" />
                              </SelectTrigger>
                              <SelectContent>
                                {allTeams?.filter(t => t.id !== newMatchTeam1).map(team => (
                                  <SelectItem key={team.id} value={team.id}>
                                    {team.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsAddMatchDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleAddMatch}>
                            Agregar
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue={groups[0]?.id}>
                    <TabsList className="mb-4">
                      {groups.map(group => (
                        <TabsTrigger key={group.id} value={group.id}>
                          {group.name} ({matches.filter(m => m.group_id === group.id).length} partidos)
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {groups.map(group => (
                      <TabsContent key={group.id} value={group.id}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          {matches
                            .filter(m => m.group_id === group.id)
                            .map((match, index) => (
                              <Card
                                key={match.id}
                                className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                              >
                                <CardHeader className="pb-2 sm:pb-3">
                                  <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-xs">Partido #{index + 1}</Badge>
                                    <Badge variant={match.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                                      <span className="hidden sm:inline">{match.status === 'completed' ? 'Completado' : 'Pendiente'}</span>
                                      <span className="sm:hidden">{match.status === 'completed' ? '✓' : '○'}</span>
                                    </Badge>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  {match.team1 && (
                                    <div className="p-3 rounded-lg bg-muted/50 border">
                                      <p className="font-semibold text-sm mb-1">{match.team1.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {match.team1.player1_name} / {match.team1.player2_name}
                                      </p>
                                    </div>
                                  )}

                                  {match.team2 ? (
                                    <>
                                      <div className="flex items-center justify-center gap-2 py-2">
                                        <div className="text-center">
                                          <p className="text-xs text-muted-foreground mb-1">Set 1</p>
                                          <div className="flex gap-1 text-sm font-bold">
                                            <span className={match.team1_set1 > match.team2_set1 ? 'text-primary' : ''}>
                                              {match.team1_set1}
                                            </span>
                                            <span>-</span>
                                            <span className={match.team2_set1 > match.team1_set1 ? 'text-primary' : ''}>
                                              {match.team2_set1}
                                            </span>
                                          </div>
                                        </div>
                                        {match.team1_set2 !== null && match.team2_set2 !== null && (
                                          <>
                                            <div className="h-8 w-px bg-border" />
                                            <div className="text-center">
                                              <p className="text-xs text-muted-foreground mb-1">Set 2</p>
                                              <div className="flex gap-1 text-sm font-bold">
                                                <span className={match.team1_set2 > match.team2_set2 ? 'text-primary' : ''}>
                                                  {match.team1_set2}
                                                </span>
                                                <span>-</span>
                                                <span className={match.team2_set2 > match.team1_set2 ? 'text-primary' : ''}>
                                                  {match.team2_set2}
                                                </span>
                                              </div>
                                            </div>
                                          </>
                                        )}
                                        {match.team1_set3 !== null && match.team2_set3 !== null && (
                                          <>
                                            <div className="h-8 w-px bg-border" />
                                            <div className="text-center">
                                              <p className="text-xs text-muted-foreground mb-1">Set 3</p>
                                              <div className="flex gap-1 text-sm font-bold">
                                                <span className={match.team1_set3 > match.team2_set3 ? 'text-primary' : ''}>
                                                  {match.team1_set3}
                                                </span>
                                                <span>-</span>
                                                <span className={match.team2_set3 > match.team1_set3 ? 'text-primary' : ''}>
                                                  {match.team2_set3}
                                                </span>
                                              </div>
                                            </div>
                                          </>
                                        )}
                                      </div>

                                      <div className="p-3 rounded-lg bg-muted/50 border">
                                        <p className="font-semibold text-sm mb-1">{match.team2.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {match.team2.player1_name} / {match.team2.player2_name}
                                        </p>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-center py-2">
                                        <span className="text-2xl font-bold text-muted-foreground">VS</span>
                                      </div>
                                      <div className="p-3 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50">
                                        <Label className="text-xs text-muted-foreground mb-2 block">
                                          Seleccionar contrincante
                                        </Label>
                                        <Select
                                          value={match.team2?.id || ""}
                                          onValueChange={(value) => {
                                            const selectedTeam = group.teams.find(t => t.id === value);
                                            if (selectedTeam) {
                                              const updatedMatches = matches.map(m =>
                                                m.id === match.id ? { ...m, team2: selectedTeam } : m
                                              );
                                              setMatches(updatedMatches);
                                            }
                                          }}
                                        >
                                          <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Seleccionar dupla..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {group.teams
                                              .filter(t => t.id !== match.team1?.id)
                                              .map(team => (
                                                <SelectItem key={team.id} value={team.id}>
                                                  {team.name}
                                                </SelectItem>
                                              ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex gap-2 pt-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1"
                                      onClick={() => handleEditMatch(match)}
                                    >
                                      <Edit className="h-3 w-3 mr-1" />
                                      Editar
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteMatch(match.id)}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* Botón de guardar */}
            {groups.length > 0 && (
              <div className="flex justify-end">
                <Button
                  size="lg"
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="gap-2"
                >
                  {isSaving ? (
                    <>Guardando...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Guardar Todo
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialog para editar partido */}
      <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Editar Partido</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Modifica los equipos y/o los resultados del partido
            </DialogDescription>
          </DialogHeader>
          {editingMatch && (
            <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
              {/* Selección de equipos */}
              <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                <h4 className="font-semibold text-sm">Equipos</h4>
                <div className="grid gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Equipo 1</Label>
                    <Select
                      value={editingMatch.team1.id}
                      onValueChange={(value) => {
                        const team = allTeams?.find(t => t.id === value);
                        if (team) {
                          setEditingMatch({
                            ...editingMatch,
                            team1: team
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {allTeams?.filter(t => t.id !== editingMatch.team2.id).map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Equipo 2</Label>
                    <Select
                      value={editingMatch.team2.id}
                      onValueChange={(value) => {
                        const team = allTeams?.find(t => t.id === value);
                        if (team) {
                          setEditingMatch({
                            ...editingMatch,
                            team2: team
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {allTeams?.filter(t => t.id !== editingMatch.team1.id).map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Resultados */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Resultados</h4>

                {/* Set 1 */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end">
                  <div>
                    <Label className="text-xs text-muted-foreground">Set 1 - {editingMatch.team1.name}</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editingMatch.team1_set1}
                      onChange={(e) => setEditingMatch({
                        ...editingMatch,
                        team1_set1: Number(e.target.value)
                      })}
                    />
                  </div>
                  <div className="flex items-end justify-center pb-2">
                    <span className="text-2xl font-bold text-muted-foreground">-</span>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Set 1 - {editingMatch.team2.name}</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editingMatch.team2_set1}
                      onChange={(e) => setEditingMatch({
                        ...editingMatch,
                        team2_set1: Number(e.target.value)
                      })}
                    />
                  </div>
                </div>

                {/* Set 2 */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end">
                  <div>
                    <Label className="text-xs text-muted-foreground">Set 2 - {editingMatch.team1.name} (Opcional)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editingMatch.team1_set2 ?? ''}
                      onChange={(e) => setEditingMatch({
                        ...editingMatch,
                        team1_set2: e.target.value ? Number(e.target.value) : null
                      })}
                      placeholder="Dejar vacío si no hubo 2do set"
                    />
                  </div>
                  <div className="flex items-end justify-center pb-2">
                    <span className="text-2xl font-bold text-muted-foreground">-</span>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Set 2 - {editingMatch.team2.name} (Opcional)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editingMatch.team2_set2 ?? ''}
                      onChange={(e) => setEditingMatch({
                        ...editingMatch,
                        team2_set2: e.target.value ? Number(e.target.value) : null
                      })}
                      placeholder="Dejar vacío si no hubo 2do set"
                    />
                  </div>
                </div>

                {/* Set 3 */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end">
                  <div>
                    <Label className="text-xs text-muted-foreground">Set 3 - {editingMatch.team1.name} (Opcional)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editingMatch.team1_set3 ?? ''}
                      onChange={(e) => setEditingMatch({
                        ...editingMatch,
                        team1_set3: e.target.value ? Number(e.target.value) : null
                      })}
                      placeholder="Dejar vacío si no hubo 3er set"
                    />
                  </div>
                  <div className="flex items-end justify-center pb-2">
                    <span className="text-2xl font-bold text-muted-foreground">-</span>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Set 3 - {editingMatch.team2.name} (Opcional)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editingMatch.team2_set3 ?? ''}
                      onChange={(e) => setEditingMatch({
                        ...editingMatch,
                        team2_set3: e.target.value ? Number(e.target.value) : null
                      })}
                      placeholder="Dejar vacío si no hubo 3er set"
                    />
                  </div>
                </div>
              </div>

              {/* Información del ganador */}
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground mb-2">
                  El ganador se calcula automáticamente: quien gane 2 sets gana el partido.
                </p>
                <p className="text-xs text-muted-foreground">
                  Un set se gana por tener más puntos que el otro equipo.
                </p>
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setIsMatchDialogOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleSaveMatch} className="w-full sm:w-auto">
              Guardar Partido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TournamentManager;
