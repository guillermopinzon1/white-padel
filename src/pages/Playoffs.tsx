import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Edit2, Crown, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTeams } from "@/hooks/useSupabase";
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

interface Match {
  id: string;
  phase: 'quarterfinals' | 'semifinals' | 'final';
  position: number;
  team1: Team | null;
  team2: Team | null;
  team1_set1: number;
  team1_set2: number | null;
  team1_set3: number | null;
  team2_set1: number;
  team2_set2: number | null;
  team2_set3: number | null;
  winner_id: string | null;
  status: 'pending' | 'completed';
}

const Playoffs = () => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("Masculino");
  const [quarterfinals, setQuarterfinals] = useState<Match[]>([]);
  const [semifinals, setSemifinals] = useState<Match[]>([]);
  const [final, setFinal] = useState<Match | null>(null);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);

  const { data: allTeams } = useTeams(selectedCategory);

  useEffect(() => {
    if (selectedCategory) {
      loadPlayoffs();
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (allTeams) {
      // Equipos que no están asignados en ningún partido
      const assignedTeamIds = new Set<string>();
      [...quarterfinals, ...semifinals, ...(final ? [final] : [])].forEach(match => {
        if (match.team1) assignedTeamIds.add(match.team1.id);
        if (match.team2) assignedTeamIds.add(match.team2.id);
      });

      setAvailableTeams(allTeams.filter(team => !assignedTeamIds.has(team.id)));
    }
  }, [allTeams, quarterfinals, semifinals, final]);

  const loadPlayoffs = async () => {
    try {
      const { data: matchesData, error } = await supabase
        .from('matches')
        .select(`
          id,
          phase,
          position,
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
        .in('phase', ['quarterfinals', 'semifinals', 'final'])
        .order('position');

      if (error) throw error;

      const quarters: Match[] = [];
      const semis: Match[] = [];
      let finalMatch: Match | null = null;

      matchesData?.forEach((m: any) => {
        const match: Match = {
          id: m.id,
          phase: m.phase,
          position: m.position,
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
        };

        if (m.phase === 'quarterfinals') quarters.push(match);
        else if (m.phase === 'semifinals') semis.push(match);
        else if (m.phase === 'final') finalMatch = match;
      });

      // Si no hay datos, inicializar brackets vacíos
      if (quarters.length === 0) {
        initializeEmptyBrackets();
      } else {
        setQuarterfinals(quarters);
        setSemifinals(semis);
        setFinal(finalMatch);
      }
    } catch (error) {
      console.error("Error loading playoffs:", error);
      // Si hay error, inicializar brackets vacíos
      initializeEmptyBrackets();
    }
  };

  const initializeEmptyBrackets = () => {
    const newQuarters: Match[] = Array.from({ length: 4 }, (_, i) => ({
      id: `temp-quarter-${i}`,
      phase: 'quarterfinals',
      position: i,
      team1: null,
      team2: null,
      team1_set1: 0,
      team1_set2: null,
      team1_set3: null,
      team2_set1: 0,
      team2_set2: null,
      team2_set3: null,
      winner_id: null,
      status: 'pending'
    }));

    const newSemis: Match[] = Array.from({ length: 2 }, (_, i) => ({
      id: `temp-semi-${i}`,
      phase: 'semifinals',
      position: i,
      team1: null,
      team2: null,
      team1_set1: 0,
      team1_set2: null,
      team1_set3: null,
      team2_set1: 0,
      team2_set2: null,
      team2_set3: null,
      winner_id: null,
      status: 'pending'
    }));

    const newFinal: Match = {
      id: `temp-final-0`,
      phase: 'final',
      position: 0,
      team1: null,
      team2: null,
      team1_set1: 0,
      team1_set2: null,
      team1_set3: null,
      team2_set1: 0,
      team2_set2: null,
      team2_set3: null,
      winner_id: null,
      status: 'pending'
    };

    setQuarterfinals(newQuarters);
    setSemifinals(newSemis);
    setFinal(newFinal);
  };

  const advanceWinner = (match: Match) => {
    if (!match.winner_id) return;

    const winner = match.winner_id === match.team1?.id ? match.team1 : match.team2;
    if (!winner) return;

    // Avanzar de cuartos a semifinales
    if (match.phase === 'quarterfinals') {
      const semiPosition = Math.floor(match.position / 2); // 0,1 -> 0 | 2,3 -> 1
      const semiSlot = match.position % 2 === 0 ? 'team1' : 'team2';

      setSemifinals(prev => prev.map(semi => {
        if (semi.position === semiPosition) {
          return {
            ...semi,
            [semiSlot]: winner
          };
        }
        return semi;
      }));
    }
    // Avanzar de semifinales a final
    else if (match.phase === 'semifinals') {
      const finalSlot = match.position === 0 ? 'team1' : 'team2';

      setFinal(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          [finalSlot]: winner
        };
      });
    }
  };

  const removeTeamFromMatch = (match: Match, slot: 'team1' | 'team2') => {
    const updateMatch = (m: Match) => {
      if (m.id === match.id) {
        return {
          ...m,
          [slot]: null,
          team1_set1: 0,
          team1_set2: null,
          team1_set3: null,
          team2_set1: 0,
          team2_set2: null,
          team2_set3: null,
          winner_id: null,
          status: 'pending' as const
        };
      }
      return m;
    };

    if (match.phase === 'quarterfinals') {
      setQuarterfinals(prev => prev.map(updateMatch));
    } else if (match.phase === 'semifinals') {
      setSemifinals(prev => prev.map(updateMatch));
    } else if (match.phase === 'final' && final) {
      setFinal(updateMatch(final));
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceId = source.droppableId;
    const destId = destination.droppableId;
    const draggedTeam = availableTeams[source.index];

    if (!draggedTeam) return;

    // Identificar el partido y la posición (team1 o team2)
    const [phase, position, slot] = destId.split('-');
    const pos = parseInt(position);

    if (phase === 'quarterfinals') {
      const matchArray = [...quarterfinals];
      const updatedMatch = { ...matchArray[pos] };
      if (slot === 'team1') updatedMatch.team1 = draggedTeam;
      else updatedMatch.team2 = draggedTeam;
      matchArray[pos] = updatedMatch;
      setQuarterfinals(matchArray);
    } else if (phase === 'semifinals') {
      const matchArray = [...semifinals];
      const updatedMatch = { ...matchArray[pos] };
      if (slot === 'team1') updatedMatch.team1 = draggedTeam;
      else updatedMatch.team2 = draggedTeam;
      matchArray[pos] = updatedMatch;
      setSemifinals(matchArray);
    } else if (phase === 'final' && final) {
      const updatedMatch = { ...final };
      if (slot === 'team1') updatedMatch.team1 = draggedTeam;
      else updatedMatch.team2 = draggedTeam;
      setFinal(updatedMatch);
    }
  };

  const saveMatchToDB = async (match: Match) => {
    if (!match.team1 || !match.team2) return null;

    try {
      // Si es temporal, crear nuevo registro
      if (match.id.startsWith('temp-')) {
        const { data, error } = await supabase
          .from('matches')
          .insert({
            category: selectedCategory,
            phase: match.phase,
            position: match.position,
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
          })
          .select()
          .single();

        if (error) throw error;

        // Actualizar el ID del match con el ID real de la DB
        const updatedMatch = { ...match, id: data.id };

        // Actualizar en el estado local
        if (match.phase === 'quarterfinals') {
          setQuarterfinals(prev => prev.map(m => m.position === match.position ? updatedMatch : m));
        } else if (match.phase === 'semifinals') {
          setSemifinals(prev => prev.map(m => m.position === match.position ? updatedMatch : m));
        } else if (match.phase === 'final') {
          setFinal(updatedMatch);
        }

        return data.id;
      } else {
        // Ya existe, actualizar
        const { error } = await supabase
          .from('matches')
          .update({
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
          })
          .eq('id', match.id);

        if (error) throw error;
        return match.id;
      }
    } catch (error) {
      console.error("Error saving match:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el partido",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleEditMatch = (match: Match) => {
    setEditingMatch(match);
    setIsMatchDialogOpen(true);
  };

  const handleSaveMatch = async () => {
    if (!editingMatch || !editingMatch.team1 || !editingMatch.team2) return;

    // Calcular ganador
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

    const totalSets = (editingMatch.team1_set2 !== null ? 1 : 0) +
                      (editingMatch.team1_set3 !== null ? 1 : 0) + 1;
    const setsToWin = Math.ceil(totalSets / 2);

    let updatedMatch = { ...editingMatch };

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
      // Guardar en DB
      const savedId = await saveMatchToDB(updatedMatch);

      if (!savedId) {
        return; // Error ya mostrado por saveMatchToDB
      }

      // Actualizar estado local con el match guardado
      updatedMatch.id = savedId;

      if (updatedMatch.phase === 'quarterfinals') {
        setQuarterfinals(prev => prev.map(m => m.position === updatedMatch.position ? updatedMatch : m));
      } else if (updatedMatch.phase === 'semifinals') {
        setSemifinals(prev => prev.map(m => m.position === updatedMatch.position ? updatedMatch : m));
      } else if (updatedMatch.phase === 'final') {
        setFinal(updatedMatch);
      }

      // Avanzar ganador a siguiente ronda
      if (updatedMatch.status === 'completed') {
        advanceWinner(updatedMatch);
      }

      setIsMatchDialogOpen(false);
      setEditingMatch(null);

      toast({
        title: "Partido guardado",
        description: updatedMatch.status === 'completed'
          ? `¡${updatedMatch.winner_id === updatedMatch.team1.id ? updatedMatch.team1.name : updatedMatch.team2.name} avanza a la siguiente ronda!`
          : "Resultado guardado"
      });
    } catch (error) {
      console.error("Error saving match:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el partido",
        variant: "destructive"
      });
    }
  };


  const renderMatchCard = (match: Match, phaseLabel: string) => (
    <Card
      className="relative hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30 bg-gradient-to-br from-white to-gray-50"
      key={match.id}
    >
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs font-medium">
            {phaseLabel}
          </Badge>
          {match.status === 'completed' && match.winner_id && (
            <Crown className="h-4 w-4 text-yellow-500" />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditMatch(match)}
            disabled={!match.team1 || !match.team2}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Team 1 */}
        <Droppable droppableId={`${match.phase}-${match.position}-team1`}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`p-2 rounded-lg border-2 border-dashed transition-all ${
                snapshot.isDraggingOver ? 'border-primary bg-primary/5' : 'border-gray-200'
              } ${match.team1 ? 'bg-white' : 'bg-gray-50'}`}
            >
              {match.team1 ? (
                <div className={`${match.winner_id === match.team1.id ? 'ring-2 ring-yellow-400' : ''} rounded p-1 relative group`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full"
                    onClick={() => removeTeamFromMatch(match, 'team1')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <p className="font-semibold text-xs sm:text-sm truncate">{match.team1.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {match.team1.player1_name} / {match.team1.player2_name}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Arrastra equipo aquí
                </p>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {/* Score */}
        {match.team1 && match.team2 && (
          <div className="flex justify-center gap-2 text-sm font-bold py-1">
            <span className={match.winner_id === match.team1.id ? 'text-primary' : ''}>
              {match.team1_set1}
            </span>
            <span>-</span>
            <span className={match.winner_id === match.team2.id ? 'text-primary' : ''}>
              {match.team2_set1}
            </span>
          </div>
        )}

        {/* Team 2 */}
        <Droppable droppableId={`${match.phase}-${match.position}-team2`}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`p-2 rounded-lg border-2 border-dashed transition-all ${
                snapshot.isDraggingOver ? 'border-primary bg-primary/5' : 'border-gray-200'
              } ${match.team2 ? 'bg-white' : 'bg-gray-50'}`}
            >
              {match.team2 ? (
                <div className={`${match.winner_id === match.team2.id ? 'ring-2 ring-yellow-400' : ''} rounded p-1 relative group`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full"
                    onClick={() => removeTeamFromMatch(match, 'team2')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <p className="font-semibold text-xs sm:text-sm truncate">{match.team2.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {match.team2.player1_name} / {match.team2.player2_name}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Arrastra equipo aquí
                </p>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-1 sm:gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Volver</span>
                </Button>
              </Link>
              <div className="h-8 w-px bg-border hidden sm:block" />
              <div>
                <h1 className="text-base sm:text-xl font-bold flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Eliminatorias
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Cuartos, Semifinales y Final
                </p>
              </div>
            </div>
            <img src={tournamentLogo} alt="White Padel" className="h-8 sm:h-10 w-auto" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-8 max-w-7xl">
        {/* Selector de categoría */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Seleccionar Categoría</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Configura las eliminatorias para cada categoría
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Femenino">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <DragDropContext onDragEnd={onDragEnd}>
          {/* Equipos disponibles */}
          {availableTeams.length > 0 && (
            <Card className="mb-4 sm:mb-6 border-2 border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm sm:text-base">
                  Equipos Disponibles ({availableTeams.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Arrastra los equipos a los partidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Droppable droppableId="available-teams">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex flex-wrap gap-2"
                    >
                      {availableTeams.map((team, index) => (
                        <Draggable key={team.id} draggableId={team.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-2 rounded-lg border-2 bg-white transition-all cursor-move ${
                                snapshot.isDragging
                                  ? 'border-primary shadow-lg scale-105 rotate-2'
                                  : 'border-gray-200 hover:border-primary/50'
                              }`}
                            >
                              <p className="font-semibold text-xs">{team.name}</p>
                              <p className="text-[10px] text-muted-foreground">
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
          )}

          <div className="space-y-6">
              {/* Cuartos de Final */}
              {quarterfinals.length > 0 && (
                <div>
                  <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="bg-gradient-to-r from-primary to-primary/60 text-white px-3 py-1 rounded-lg">
                      Cuartos de Final
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {quarterfinals.map((match, index) =>
                      renderMatchCard(match, `Cuarto ${index + 1}`)
                    )}
                  </div>
                </div>
              )}

              {/* Semifinales */}
              {semifinals.length > 0 && (
                <div>
                  <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="bg-gradient-to-r from-orange-500 to-orange-400 text-white px-3 py-1 rounded-lg">
                      Semifinales
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
                    {semifinals.map((match, index) =>
                      renderMatchCard(match, `Semifinal ${index + 1}`)
                    )}
                  </div>
                </div>
              )}

              {/* Final */}
              {final && (
                <div>
                  <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center justify-center gap-2">
                    <span className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
                      <Crown className="h-5 w-5" />
                      FINAL
                      <Crown className="h-5 w-5" />
                    </span>
                  </h2>
                  <div className="max-w-md mx-auto">
                    {renderMatchCard(final, "Final")}
                  </div>
                </div>
              )}
          </div>
        </DragDropContext>
      </main>

      {/* Dialog editar partido */}
      <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Editar Resultado</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Ingresa los resultados del partido
            </DialogDescription>
          </DialogHeader>
          {editingMatch && editingMatch.team1 && editingMatch.team2 && (
            <div className="space-y-4 py-2">
              <div className="space-y-3">
                {/* Set 1 */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Set 1 - {editingMatch.team1.name}
                    </Label>
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
                    <Label className="text-xs text-muted-foreground">
                      Set 1 - {editingMatch.team2.name}
                    </Label>
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
                    <Label className="text-xs text-muted-foreground">
                      Set 2 (Opcional)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={editingMatch.team1_set2 ?? ''}
                      onChange={(e) => setEditingMatch({
                        ...editingMatch,
                        team1_set2: e.target.value ? Number(e.target.value) : null
                      })}
                      placeholder="Opcional"
                    />
                  </div>
                  <div className="flex items-end justify-center pb-2">
                    <span className="text-2xl font-bold text-muted-foreground">-</span>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Set 2 (Opcional)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={editingMatch.team2_set2 ?? ''}
                      onChange={(e) => setEditingMatch({
                        ...editingMatch,
                        team2_set2: e.target.value ? Number(e.target.value) : null
                      })}
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                {/* Set 3 */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Set 3 (Opcional)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={editingMatch.team1_set3 ?? ''}
                      onChange={(e) => setEditingMatch({
                        ...editingMatch,
                        team1_set3: e.target.value ? Number(e.target.value) : null
                      })}
                      placeholder="Opcional"
                    />
                  </div>
                  <div className="flex items-end justify-center pb-2">
                    <span className="text-2xl font-bold text-muted-foreground">-</span>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Set 3 (Opcional)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={editingMatch.team2_set3 ?? ''}
                      onChange={(e) => setEditingMatch({
                        ...editingMatch,
                        team2_set3: e.target.value ? Number(e.target.value) : null
                      })}
                      placeholder="Opcional"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsMatchDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveMatch}
              className="w-full sm:w-auto"
            >
              Guardar Resultado
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Playoffs;
