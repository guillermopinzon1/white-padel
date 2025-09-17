import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Pencil, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import tournamentLogo from "@/assets/white-padel-tournament-logo.png";

interface Player {
  id: string;
  name: string;
  partner: string;
}

const CategoryManagement = () => {
  const { categoryId } = useParams();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [partnerName, setPartnerName] = useState("");

  const categoryNames = {
    "5-masculino": "5ta Masculino",
    "5-femenino": "5ta Femenino", 
    "6-masculino": "6ta Masculino",
    "6-femenino": "6ta Femenino",
    "7-masculino": "7ta Masculino",
    "7-femenino": "7ta Femenino",
  };

  const categoryName = categoryNames[categoryId as keyof typeof categoryNames] || "Categoría";

  const handleSavePlayer = () => {
    if (!playerName.trim() || !partnerName.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    if (editingPlayer) {
      setPlayers(players.map(p => 
        p.id === editingPlayer.id 
          ? { ...p, name: playerName, partner: partnerName }
          : p
      ));
      toast({
        title: "Dupla actualizada",
        description: `${playerName} y ${partnerName} han sido actualizados`,
      });
    } else {
      const newPlayer: Player = {
        id: Date.now().toString(),
        name: playerName,
        partner: partnerName,
      };
      setPlayers([...players, newPlayer]);
      toast({
        title: "Dupla agregada",
        description: `${playerName} y ${partnerName} han sido registrados`,
      });
    }

    setPlayerName("");
    setPartnerName("");
    setEditingPlayer(null);
    setIsDialogOpen(false);
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setPlayerName(player.name);
    setPartnerName(player.partner);
    setIsDialogOpen(true);
  };

  const handleDeletePlayer = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    setPlayers(players.filter(p => p.id !== playerId));
    if (player) {
      toast({
        title: "Dupla eliminada",
        description: `${player.name} y ${player.partner} han sido eliminados`,
      });
    }
  };

  const openAddDialog = () => {
    setEditingPlayer(null);
    setPlayerName("");
    setPartnerName("");
    setIsDialogOpen(true);
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
            <p className="text-muted-foreground">{players.length} duplas en total</p>
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
            {players.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Jugador 1</TableHead>
                    <TableHead>Jugador 2</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((player, index) => (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{player.name}</TableCell>
                      <TableCell>{player.partner}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPlayer(player)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePlayer(player.id)}
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