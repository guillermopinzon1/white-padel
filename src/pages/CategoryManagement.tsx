import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Pencil, Trash2, Users, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTeams, useCreateTeam, useUpdateTeam, useDeleteTeam } from "@/hooks/useSupabase";
import tournamentLogo from "@/assets/white-padel-tournament-logo.png";

interface Player {
  id: string;
  name: string;
  partner: string;
}

const CategoryManagement = () => {
  const { categoryId } = useParams();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<any | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [teamName, setTeamName] = useState("");

  const categoryNames: Record<string, string> = {
    "masculino": "Masculino",
    "femenino": "Femenino",
  };

  const categoryName = categoryNames[categoryId as string] || "Categoría";

  // Hooks de Supabase
  const { data: teams, isLoading } = useTeams(categoryName);
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();

  const handleSavePlayer = async () => {
    if (!playerName.trim() || !partnerName.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    const generatedTeamName = teamName.trim() || `${playerName} / ${partnerName}`;

    try {
      if (editingPlayer) {
        await updateTeam.mutateAsync({
          id: editingPlayer.id,
          name: generatedTeamName,
          player1_name: playerName,
          player2_name: partnerName,
        });
        toast({
          title: "Dupla actualizada",
          description: `${playerName} y ${partnerName} han sido actualizados`,
        });
      } else {
        await createTeam.mutateAsync({
          name: generatedTeamName,
          player1_name: playerName,
          player2_name: partnerName,
          category: categoryName,
        });
        toast({
          title: "Dupla agregada",
          description: `${playerName} y ${partnerName} han sido registrados en Supabase`,
        });
      }

      setPlayerName("");
      setPartnerName("");
      setTeamName("");
      setEditingPlayer(null);
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la dupla. Verifica tu conexión.",
        variant: "destructive",
      });
      console.error("Error saving team:", error);
    }
  };

  const handleEditPlayer = (team: any) => {
    setEditingPlayer(team);
    setTeamName(team.name);
    setPlayerName(team.player1_name);
    setPartnerName(team.player2_name);
    setIsDialogOpen(true);
  };

  const handleDeletePlayer = async (teamId: string) => {
    const team = teams?.find(t => t.id === teamId);
    try {
      await deleteTeam.mutateAsync(teamId);
      if (team) {
        toast({
          title: "Dupla eliminada",
          description: `${team.player1_name} y ${team.player2_name} han sido eliminados`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la dupla",
        variant: "destructive",
      });
      console.error("Error deleting team:", error);
    }
  };

  const openAddDialog = () => {
    setEditingPlayer(null);
    setPlayerName("");
    setPartnerName("");
    setTeamName("");
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-padel-gradient flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando equipos...</p>
        </div>
      </div>
    );
  }

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
                <Users className="h-6 w-6" />
                <h1 className="text-2xl font-bold">{categoryName}</h1>
              </div>
            </div>
            <img src={tournamentLogo} alt="White Padel" className="h-12 w-auto" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Duplas Registradas</h2>
            <p className="text-muted-foreground">{teams?.length || 0} duplas en total</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Dupla
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingPlayer ? "Editar Dupla" : "Agregar Nueva Dupla"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="teamName">Nombre del Equipo (Opcional)</Label>
                  <Input
                    id="teamName"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Ej: Los Campeones"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Si no ingresas un nombre, se usará: Jugador 1 / Jugador 2
                  </p>
                </div>
                <div>
                  <Label htmlFor="player1">Jugador 1</Label>
                  <Input
                    id="player1"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Nombre del primer jugador"
                  />
                </div>
                <div>
                  <Label htmlFor="player2">Jugador 2</Label>
                  <Input
                    id="player2"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="Nombre del segundo jugador"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSavePlayer}>
                    {editingPlayer ? "Actualizar" : "Agregar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-padel">
          <CardHeader>
            <CardTitle>Lista de Duplas</CardTitle>
          </CardHeader>
          <CardContent>
            {teams && teams.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Nombre del Equipo</TableHead>
                    <TableHead>Jugador 1</TableHead>
                    <TableHead>Jugador 2</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team, index) => (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-semibold">{team.name}</TableCell>
                      <TableCell>{team.player1_name}</TableCell>
                      <TableCell>{team.player2_name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPlayer(team)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePlayer(team.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay duplas registradas</h3>
                <p className="text-muted-foreground mb-4">
                  Comienza agregando las duplas que participarán en esta categoría
                </p>
                <Button onClick={openAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primera Dupla
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CategoryManagement;