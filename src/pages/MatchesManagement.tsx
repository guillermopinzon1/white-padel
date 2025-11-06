import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Save, Loader2, Trophy, Calendar, MapPin, Users as UsersIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGroups, useCategories, useCreateMatch, useMatches, useUpdateMatch } from "@/hooks/useSupabase";
import tournamentLogo from "@/assets/white-padel-tournament-logo.png";

interface MatchResult {
  team1_set1: number;
  team1_set2: number;
  team1_set3: number | null;
  team2_set1: number;
  team2_set2: number;
  team2_set3: number | null;
  winner_id: string | null;
}

const MatchesManagement = () => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [matchResults, setMatchResults] = useState<Record<string, MatchResult>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  // Hooks de Supabase
  const { data: categories, isLoading: loadingCategories } = useCategories();
  const { data: groups, isLoading: loadingGroups } = useGroups(selectedCategory);
  const { data: existingMatches, isLoading: loadingMatches } = useMatches("group", selectedCategory);
  const createMatch = useCreateMatch();
  const updateMatch = useUpdateMatch();

  // Mapear categorías
  const categoryOptions = categories?.map(cat => ({
    value: cat.name,
    label: cat.name
  })) || [];

  // Filtrar grupos de la categoría seleccionada
  const groupOptions = useMemo(() => {
    if (!groups) return [];
    return groups.map(group => ({
      value: group.id,
      label: group.name
    }));
  }, [groups]);

  // Obtener el grupo seleccionado
  const currentGroup = useMemo(() => {
    if (!groups || !selectedGroup) return null;
    return groups.find(g => g.id === selectedGroup);
  }, [groups, selectedGroup]);

  // Filtrar partidos del grupo seleccionado
  const groupMatches = useMemo(() => {
    if (!existingMatches || !selectedGroup) return [];
    return existingMatches.filter(match => match.group_id === selectedGroup);
  }, [existingMatches, selectedGroup]);

  // Generar todos los partidos (round-robin)
  const generateMatches = async () => {
    if (!currentGroup || !currentGroup.group_teams) {
      toast({
        title: "Error",
        description: "Selecciona un grupo válido primero",
        variant: "destructive",
      });
      return;
    }

    const teams = currentGroup.group_teams.map((gt: any) => gt.teams);

    if (teams.length < 2) {
      toast({
        title: "Error",
        description: "El grupo debe tener al menos 2 equipos",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const matchesToCreate = [];

      // Generar partidos todos contra todos
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          matchesToCreate.push({
            category: selectedCategory,
            phase: "group",
            group_id: selectedGroup,
            team1_id: teams[i].id,
            team2_id: teams[j].id,
            status: "pending",
          });
        }
      }

      // Crear partidos en Supabase
      for (const match of matchesToCreate) {
        await createMatch.mutateAsync(match);
      }

      toast({
        title: "Partidos generados",
        description: `Se crearon ${matchesToCreate.length} partidos para el grupo`,
      });
    } catch (error) {
      console.error("Error generating matches:", error);
      toast({
        title: "Error",
        description: "No se pudieron generar los partidos",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Calcular total de partidos posibles
  const totalPossibleMatches = useMemo(() => {
    if (!currentGroup?.group_teams) return 0;
    const n = currentGroup.group_teams.length;
    return (n * (n - 1)) / 2; // Combinaciones de n equipos tomados de 2 en 2
  }, [currentGroup]);

  // Actualizar resultado de partido
  const handleUpdateMatch = async (matchId: string) => {
    const result = matchResults[matchId];
    if (!result) return;

    // Validar que se hayan ingresado resultados
    if (result.team1_set1 === 0 && result.team1_set2 === 0 && result.team2_set1 === 0 && result.team2_set2 === 0) {
      toast({
        title: "Error",
        description: "Ingresa los resultados del partido",
        variant: "destructive",
      });
      return;
    }

    // Calcular ganador
    let team1Sets = 0;
    let team2Sets = 0;

    if (result.team1_set1 > result.team2_set1) team1Sets++;
    else team2Sets++;

    if (result.team1_set2 > result.team2_set2) team1Sets++;
    else team2Sets++;

    if (result.team1_set3 !== null && result.team2_set3 !== null) {
      if (result.team1_set3 > result.team2_set3) team1Sets++;
      else team2Sets++;
    }

    const match = groupMatches.find(m => m.id === matchId);
    if (!match) return;

    const winnerId = team1Sets > team2Sets ? match.team1_id : match.team2_id;

    try {
      await updateMatch.mutateAsync({
        id: matchId,
        ...result,
        winner_id: winnerId,
        status: "completed",
      });

      toast({
        title: "Partido actualizado",
        description: "El resultado ha sido guardado exitosamente",
      });

      setEditingMatch(null);
      setMatchResults(prev => {
        const newResults = { ...prev };
        delete newResults[matchId];
        return newResults;
      });
    } catch (error) {
      console.error("Error updating match:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el partido",
        variant: "destructive",
      });
    }
  };

  // Iniciar edición de partido
  const startEditMatch = (match: any) => {
    setEditingMatch(match.id);
    setMatchResults(prev => ({
      ...prev,
      [match.id]: {
        team1_set1: match.team1_set1 || 0,
        team1_set2: match.team1_set2 || 0,
        team1_set3: match.team1_set3,
        team2_set1: match.team2_set1 || 0,
        team2_set2: match.team2_set2 || 0,
        team2_set3: match.team2_set3,
        winner_id: match.winner_id,
      }
    }));
  };

  if (loadingCategories || loadingGroups) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </Button>
              </Link>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-foreground/5 p-2">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">Gestión de Partidos</h1>
                  <p className="text-xs text-muted-foreground">Administra los partidos de grupo</p>
                </div>
              </div>
            </div>
            <img src={tournamentLogo} alt="White Padel" className="h-10 w-auto" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Filters */}
        <div className="mb-8">
          <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
            <div className="border-b border-border/50 px-6 py-4">
              <h2 className="text-lg font-semibold">Seleccionar Grupo</h2>
              <p className="text-sm text-muted-foreground mt-1">Elige la categoría y el grupo para gestionar partidos</p>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Categoría</Label>
                  <Select value={selectedCategory} onValueChange={(value) => {
                    setSelectedCategory(value);
                    setSelectedGroup("");
                  }}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Grupo</Label>
                  <Select
                    value={selectedGroup}
                    onValueChange={setSelectedGroup}
                    disabled={!selectedCategory}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Seleccionar grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupOptions.map(group => (
                        <SelectItem key={group.value} value={group.value}>
                          {group.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={generateMatches}
                    disabled={!selectedGroup || isGenerating || groupMatches.length > 0}
                    className="w-full h-11 gap-2 bg-foreground text-background hover:bg-foreground/90"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Generar Partidos
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Match Count Info */}
              {selectedGroup && currentGroup && (
                <div className="mt-4 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 rounded-lg bg-foreground/5 px-3 py-2">
                    <UsersIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Equipos:</span>
                    <span className="font-semibold">{currentGroup.group_teams?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-foreground/5 px-3 py-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Partidos totales:</span>
                    <span className="font-semibold">{totalPossibleMatches}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-foreground/5 px-3 py-2">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Generados:</span>
                    <span className="font-semibold">{groupMatches.length}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Matches List */}
        {selectedGroup && groupMatches.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Partidos del Grupo</h3>
              <p className="text-sm text-muted-foreground">
                {groupMatches.filter(m => m.status === 'completed').length} de {groupMatches.length} completados
              </p>
            </div>

            <div className="grid gap-4">
              {groupMatches.map((match, index) => {
                const isEditing = editingMatch === match.id;
                const result = matchResults[match.id];

                return (
                  <div
                    key={match.id}
                    className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm"
                  >
                    <div className="p-6">
                      {/* Match Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/10 text-sm font-bold">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-medium">Partido {index + 1}</p>
                            <p className="text-xs text-muted-foreground">
                              {match.status === 'completed' ? 'Finalizado' : 'Pendiente'}
                            </p>
                          </div>
                        </div>
                        {match.status === 'completed' && match.winner && (
                          <div className="flex items-center gap-2 rounded-full bg-foreground/10 px-3 py-1">
                            <Trophy className="h-4 w-4" />
                            <span className="text-sm font-medium">Ganador: {match.winner.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Teams */}
                      <div className="space-y-3">
                        {/* Team 1 */}
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <p className="font-bold text-sm">{match.team1.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {match.team1.player1_name} / {match.team1.player2_name}
                            </p>
                          </div>

                          {isEditing ? (
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                min="0"
                                max="7"
                                placeholder="Set 1"
                                value={result?.team1_set1 || 0}
                                onChange={(e) => setMatchResults(prev => ({
                                  ...prev,
                                  [match.id]: { ...prev[match.id], team1_set1: Number(e.target.value) }
                                }))}
                                className="w-16 h-10"
                              />
                              <Input
                                type="number"
                                min="0"
                                max="7"
                                placeholder="Set 2"
                                value={result?.team1_set2 || 0}
                                onChange={(e) => setMatchResults(prev => ({
                                  ...prev,
                                  [match.id]: { ...prev[match.id], team1_set2: Number(e.target.value) }
                                }))}
                                className="w-16 h-10"
                              />
                              <Input
                                type="number"
                                min="0"
                                max="7"
                                placeholder="Set 3"
                                value={result?.team1_set3 || ""}
                                onChange={(e) => setMatchResults(prev => ({
                                  ...prev,
                                  [match.id]: { ...prev[match.id], team1_set3: e.target.value ? Number(e.target.value) : null }
                                }))}
                                className="w-16 h-10"
                              />
                            </div>
                          ) : (
                            <div className="flex gap-2 text-lg font-bold">
                              <span className="w-10 text-center">{match.team1_set1 || '-'}</span>
                              <span className="w-10 text-center">{match.team1_set2 || '-'}</span>
                              <span className="w-10 text-center">{match.team1_set3 ?? '-'}</span>
                            </div>
                          )}
                        </div>

                        <div className="h-px bg-border" />

                        {/* Team 2 */}
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <p className="font-bold text-sm">{match.team2.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {match.team2.player1_name} / {match.team2.player2_name}
                            </p>
                          </div>

                          {isEditing ? (
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                min="0"
                                max="7"
                                placeholder="Set 1"
                                value={result?.team2_set1 || 0}
                                onChange={(e) => setMatchResults(prev => ({
                                  ...prev,
                                  [match.id]: { ...prev[match.id], team2_set1: Number(e.target.value) }
                                }))}
                                className="w-16 h-10"
                              />
                              <Input
                                type="number"
                                min="0"
                                max="7"
                                placeholder="Set 2"
                                value={result?.team2_set2 || 0}
                                onChange={(e) => setMatchResults(prev => ({
                                  ...prev,
                                  [match.id]: { ...prev[match.id], team2_set2: Number(e.target.value) }
                                }))}
                                className="w-16 h-10"
                              />
                              <Input
                                type="number"
                                min="0"
                                max="7"
                                placeholder="Set 3"
                                value={result?.team2_set3 || ""}
                                onChange={(e) => setMatchResults(prev => ({
                                  ...prev,
                                  [match.id]: { ...prev[match.id], team2_set3: e.target.value ? Number(e.target.value) : null }
                                }))}
                                className="w-16 h-10"
                              />
                            </div>
                          ) : (
                            <div className="flex gap-2 text-lg font-bold">
                              <span className="w-10 text-center">{match.team2_set1 || '-'}</span>
                              <span className="w-10 text-center">{match.team2_set2 || '-'}</span>
                              <span className="w-10 text-center">{match.team2_set3 ?? '-'}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex justify-end gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingMatch(null);
                                setMatchResults(prev => {
                                  const newResults = { ...prev };
                                  delete newResults[match.id];
                                  return newResults;
                                });
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateMatch(match.id)}
                              className="gap-2 bg-foreground text-background hover:bg-foreground/90"
                            >
                              <Save className="h-4 w-4" />
                              Guardar Resultado
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditMatch(match)}
                          >
                            {match.status === 'completed' ? 'Editar Resultado' : 'Ingresar Resultado'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {selectedGroup && groupMatches.length === 0 && !isGenerating && (
          <div className="rounded-xl border border-dashed border-border/50 bg-muted/20 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-foreground/5">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No hay partidos generados</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Presiona "Generar Partidos" para crear automáticamente todos los partidos del grupo
            </p>
          </div>
        )}

        {!selectedGroup && (
          <div className="rounded-xl border border-dashed border-border/50 bg-muted/20 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-foreground/5">
              <UsersIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Selecciona un grupo</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Elige una categoría y un grupo para comenzar a gestionar los partidos
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default MatchesManagement;
