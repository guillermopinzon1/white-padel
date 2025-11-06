import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Users, Settings, Trash2, Plus, Shuffle, UserPlus, UserMinus, Edit3, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTeams, useCategories, useGroups, useCreateGroup, useAddTeamToGroup } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import tournamentLogo from "@/assets/white-padel-tournament-logo.png";

const GroupsManagement = () => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isAddTeamDialogOpen, setIsAddTeamDialogOpen] = useState(false);
  const [selectedGroupForAdd, setSelectedGroupForAdd] = useState<string>("");
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [teamToRemove, setTeamToRemove] = useState<{ teamId: string; groupId: string } | null>(null);

  // Generation settings
  const [numberOfGroups, setNumberOfGroups] = useState<number>(2);
  const [groupSize, setGroupSize] = useState<number>(4);
  const [isGenerating, setIsGenerating] = useState(false);

  // Hooks de Supabase
  const { data: categories, isLoading: loadingCategories } = useCategories();
  const { data: groups, isLoading: loadingGroups, refetch: refetchGroups } = useGroups(selectedCategory);
  const { data: allTeams } = useTeams(selectedCategory);
  const createGroup = useCreateGroup();
  const addTeamToGroup = useAddTeamToGroup();

  // Mapear categorías
  const categoryOptions = categories?.map(cat => ({
    value: cat.name,
    label: cat.name
  })) || [];

  // Equipos no asignados a ningún grupo
  const unassignedTeams = useMemo(() => {
    if (!allTeams || !groups) return allTeams || [];

    const assignedTeamIds = new Set(
      groups.flatMap(g => g.group_teams?.map((gt: any) => gt.team_id) || [])
    );

    return allTeams.filter(team => !assignedTeamIds.has(team.id));
  }, [allTeams, groups]);

  // Generar grupos automáticamente
  const handleGenerateGroups = async () => {
    if (!selectedCategory || !allTeams || allTeams.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona una categoría con equipos registrados",
        variant: "destructive",
      });
      return;
    }

    const categoryTeams = allTeams.filter(team => team.category === selectedCategory);

    if (categoryTeams.length === 0) {
      toast({
        title: "Sin equipos",
        description: `No hay equipos en la categoría "${selectedCategory}"`,
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Mezclar equipos aleatoriamente
      const shuffledTeams = [...categoryTeams].sort(() => Math.random() - 0.5);

      // Crear grupos
      for (let i = 0; i < numberOfGroups; i++) {
        const groupName = `Grupo ${String.fromCharCode(65 + i)}`; // A, B, C...

        const createdGroup = await createGroup.mutateAsync({
          name: groupName,
          category: selectedCategory,
        });

        // Distribuir equipos
        for (let j = i; j < shuffledTeams.length; j += numberOfGroups) {
          if (shuffledTeams[j]) {
            await addTeamToGroup.mutateAsync({
              groupId: createdGroup.id,
              teamId: shuffledTeams[j].id,
            });
          }
        }
      }

      toast({
        title: "Grupos generados",
        description: `Se crearon ${numberOfGroups} grupos exitosamente`,
      });

      setIsGenerateDialogOpen(false);
      refetchGroups();
    } catch (error) {
      console.error("Error generating groups:", error);
      toast({
        title: "Error",
        description: "No se pudieron generar los grupos",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Eliminar grupo completo
  const handleDeleteGroup = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      toast({
        title: "Grupo eliminado",
        description: "El grupo ha sido eliminado exitosamente",
      });

      refetchGroups();
    } catch (error) {
      console.error("Error deleting group:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el grupo",
        variant: "destructive",
      });
    } finally {
      setGroupToDelete(null);
    }
  };

  // Remover equipo de un grupo
  const handleRemoveTeamFromGroup = async (teamId: string, groupId: string) => {
    try {
      // Eliminar de group_teams
      const { error: groupTeamError } = await supabase
        .from('group_teams')
        .delete()
        .eq('team_id', teamId)
        .eq('group_id', groupId);

      if (groupTeamError) throw groupTeamError;

      // Eliminar de standings
      const { error: standingsError } = await supabase
        .from('standings')
        .delete()
        .eq('team_id', teamId)
        .eq('group_id', groupId);

      if (standingsError) throw standingsError;

      toast({
        title: "Equipo removido",
        description: "El equipo ha sido removido del grupo",
      });

      refetchGroups();
    } catch (error) {
      console.error("Error removing team:", error);
      toast({
        title: "Error",
        description: "No se pudo remover el equipo",
        variant: "destructive",
      });
    } finally {
      setTeamToRemove(null);
    }
  };

  // Agregar equipo a grupo
  const handleAddTeamToGroup = async (teamId: string) => {
    if (!selectedGroupForAdd) return;

    try {
      await addTeamToGroup.mutateAsync({
        groupId: selectedGroupForAdd,
        teamId: teamId,
      });

      toast({
        title: "Equipo agregado",
        description: "El equipo ha sido agregado al grupo",
      });

      setIsAddTeamDialogOpen(false);
      refetchGroups();
    } catch (error) {
      console.error("Error adding team:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar el equipo al grupo",
        variant: "destructive",
      });
    }
  };

  if (loadingCategories) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
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
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">Gestión de Grupos</h1>
                  <p className="text-xs text-muted-foreground">Organiza y administra tus grupos</p>
                </div>
              </div>
            </div>
            <img src={tournamentLogo} alt="White Padel" className="h-10 w-auto" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Category Selector & Actions */}
        <div className="mb-8">
          <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
            <div className="border-b border-border/50 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Seleccionar Categoría</h2>
                  <p className="text-sm text-muted-foreground mt-1">Elige una categoría para gestionar sus grupos</p>
                </div>
                <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-foreground text-background hover:bg-foreground/90" disabled={!selectedCategory}>
                      <Shuffle className="h-4 w-4" />
                      Generar Nuevos Grupos
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Generar Grupos Automáticamente</DialogTitle>
                      <DialogDescription>
                        Los equipos se distribuirán aleatoriamente en los grupos
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Número de grupos</Label>
                        <Input
                          type="number"
                          min="2"
                          max="8"
                          value={numberOfGroups}
                          onChange={(e) => setNumberOfGroups(Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Equipos por grupo (máximo)</Label>
                        <Input
                          type="number"
                          min="2"
                          max="8"
                          value={groupSize}
                          onChange={(e) => setGroupSize(Number(e.target.value))}
                        />
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-sm text-muted-foreground">
                          Se generarán <span className="font-semibold">{numberOfGroups} grupos</span> con los equipos de la categoría <span className="font-semibold">{selectedCategory}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleGenerateGroups}
                        disabled={isGenerating}
                        className="gap-2 bg-foreground text-background hover:bg-foreground/90"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generando...
                          </>
                        ) : (
                          <>
                            <Shuffle className="h-4 w-4" />
                            Generar
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="p-6">
              <div className="max-w-md">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Categoría</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-11 mt-2">
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
            </div>
          </div>
        </div>

        {/* Groups Display */}
        {selectedCategory && groups && groups.length > 0 ? (
          <>
            {/* Stats */}
            <div className="mb-6 flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-lg bg-foreground/5 px-4 py-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total de grupos:</span>
                <span className="font-semibold">{groups.length}</span>
              </div>
              {unassignedTeams.length > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-foreground/5 px-4 py-2">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Equipos sin grupo:</span>
                  <span className="font-semibold">{unassignedTeams.length}</span>
                </div>
              )}
            </div>

            {/* Groups Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group: any) => (
                <div key={group.id} className="group relative">
                  <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm transition-all hover:shadow-md hover:border-border">
                    {/* Group Header */}
                    <div className="border-b border-border/50 px-5 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold tracking-tight">{group.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {group.group_teams?.length || 0} equipos
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setSelectedGroupForAdd(group.id)}
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Agregar Equipo a {group.name}</DialogTitle>
                                <DialogDescription>
                                  Selecciona un equipo disponible para agregar al grupo
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-4">
                                {unassignedTeams.length > 0 ? (
                                  <div className="space-y-2">
                                    {unassignedTeams.map(team => (
                                      <div
                                        key={team.id}
                                        className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50"
                                      >
                                        <div>
                                          <p className="font-semibold text-sm">{team.name}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {team.player1_name} / {team.player2_name}
                                          </p>
                                        </div>
                                        <Button
                                          size="sm"
                                          onClick={() => handleAddTeamToGroup(team.id)}
                                          className="gap-2"
                                        >
                                          <Plus className="h-4 w-4" />
                                          Agregar
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8 text-muted-foreground">
                                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No hay equipos disponibles</p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => setGroupToDelete(group.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Teams List */}
                    <div className="p-4 space-y-2">
                      {group.group_teams && group.group_teams.length > 0 ? (
                        group.group_teams.map((gt: any, index: number) => (
                          <div
                            key={gt.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground/10 text-xs font-bold shrink-0">
                                {index + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate">{gt.teams.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {gt.teams.player1_name} / {gt.teams.player2_name}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 shrink-0 text-destructive hover:text-destructive"
                              onClick={() => setTeamToRemove({ teamId: gt.teams.id, groupId: group.id })}
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Grupo vacío</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : selectedCategory && (!groups || groups.length === 0) ? (
          <div className="rounded-xl border border-dashed border-border/50 bg-muted/20 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-foreground/5">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No hay grupos creados</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Genera grupos automáticamente o créalos manualmente para esta categoría
            </p>
            <Button onClick={() => setIsGenerateDialogOpen(true)} className="gap-2">
              <Shuffle className="h-4 w-4" />
              Generar Grupos
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/50 bg-muted/20 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-foreground/5">
              <Settings className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Selecciona una categoría</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Elige una categoría arriba para ver y gestionar sus grupos
            </p>
          </div>
        )}
      </main>

      {/* Delete Group Dialog */}
      <AlertDialog open={!!groupToDelete} onOpenChange={() => setGroupToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el grupo y todas sus relaciones. Los equipos no se eliminarán, solo se removerán del grupo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => groupToDelete && handleDeleteGroup(groupToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Team Dialog */}
      <AlertDialog open={!!teamToRemove} onOpenChange={() => setTeamToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Remover equipo del grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              El equipo se quitará del grupo pero no se eliminará. Podrás agregarlo nuevamente después.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => teamToRemove && handleRemoveTeamFromGroup(teamToRemove.teamId, teamToRemove.groupId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GroupsManagement;
