import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy } from "lucide-react";
import tournamentLogo from "@/assets/white-padel-tournament-logo.png";
import { supabase } from "@/lib/supabase";

interface Team {
  id: string;
  name: string;
  player1_name: string;
  player2_name: string;
  category: string;
}

interface Match {
  id: string;
  group_id: string;
  team1: Team;
  team2: Team;
  team1_set1: number;
  team1_set2: number;
  team1_set3: number | null;
  team2_set1: number;
  team2_set2: number;
  team2_set3: number | null;
  winner_id: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  group: {
    name: string;
  };
}

interface TeamStanding {
  teamId: string;
  teamName: string;
  groupName: string;
  played: number;
  won: number;
  lost: number;
}

const MatchesTable = () => {
  const location = useLocation();
  const isPlayersMode = location.pathname.includes('/players');

  const [masculinoMatches, setMasculinoMatches] = useState<Match[]>([]);
  const [femeninoMatches, setFemeninoMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const calculateStandings = (matches: Match[]): Map<string, TeamStanding[]> => {
    const standingsByGroup = new Map<string, Map<string, TeamStanding>>();

    matches.forEach(match => {
      if (match.status !== 'completed') return;

      const groupName = match.group?.name || 'Sin grupo';

      if (!standingsByGroup.has(groupName)) {
        standingsByGroup.set(groupName, new Map());
      }

      const groupStandings = standingsByGroup.get(groupName)!;

      // Procesar equipo 1
      if (!groupStandings.has(match.team1.id)) {
        groupStandings.set(match.team1.id, {
          teamId: match.team1.id,
          teamName: match.team1.name,
          groupName: groupName,
          played: 0,
          won: 0,
          lost: 0
        });
      }

      // Procesar equipo 2
      if (!groupStandings.has(match.team2.id)) {
        groupStandings.set(match.team2.id, {
          teamId: match.team2.id,
          teamName: match.team2.name,
          groupName: groupName,
          played: 0,
          won: 0,
          lost: 0
        });
      }

      const team1Standing = groupStandings.get(match.team1.id)!;
      const team2Standing = groupStandings.get(match.team2.id)!;

      team1Standing.played++;
      team2Standing.played++;

      if (match.winner_id === match.team1.id) {
        team1Standing.won++;
        team2Standing.lost++;
      } else if (match.winner_id === match.team2.id) {
        team2Standing.won++;
        team1Standing.lost++;
      }
    });

    // Convertir y ordenar
    const result = new Map<string, TeamStanding[]>();
    standingsByGroup.forEach((standings, groupName) => {
      const sortedStandings = Array.from(standings.values()).sort((a, b) => {
        if (b.won !== a.won) return b.won - a.won;
        return a.lost - b.lost;
      });
      result.set(groupName, sortedStandings);
    });

    return result;
  };

  const renderStandingsTable = (matches: Match[]) => {
    const standings = calculateStandings(matches);

    if (standings.size === 0) {
      return null;
    }

    const groupsArray = Array.from(standings.entries());
    const groupCount = groupsArray.length;

    // Si hay 2 grupos, mostrar en grid con mejor espaciado
    const gridCols = groupCount === 2 ? 'grid-cols-2' : 'grid-cols-1';

    return (
      <div className={`grid ${gridCols} gap-4 mb-4`}>
        {groupsArray.map(([groupName, groupStandings]) => (
          <Card key={groupName} className="bg-white/60 min-w-0">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm font-bold break-words">{groupName}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left py-1.5 px-2 font-semibold w-8">#</th>
                      <th className="text-left py-1.5 px-2 font-semibold min-w-[120px]">Dupla</th>
                      <th className="text-center py-1.5 px-2 font-semibold w-10">PJ</th>
                      <th className="text-center py-1.5 px-2 font-semibold w-10">PG</th>
                      <th className="text-center py-1.5 px-2 font-semibold w-10">PP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupStandings.map((standing, index) => (
                      <tr
                        key={standing.teamId}
                        className={`border-t ${index < 2 ? 'bg-green-50/50' : ''}`}
                      >
                        <td className="py-1.5 px-2 font-bold">{index + 1}</td>
                        <td className="py-1.5 px-2 font-semibold break-words max-w-[200px]">
                          <span className="block truncate" title={standing.teamName}>
                            {standing.teamName}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 text-center">{standing.played}</td>
                        <td className="py-1.5 px-2 text-center font-bold text-green-600">{standing.won}</td>
                        <td className="py-1.5 px-2 text-center text-red-600">{standing.lost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const loadMatches = async () => {
    try {
      // Cargar partidos de Masculino
      const { data: masculinoData, error: masculinoError } = await supabase
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
          team2:teams!matches_team2_id_fkey (*),
          group:groups (name)
        `)
        .eq('category', 'Masculino')
        .eq('phase', 'group')
        .order('created_at', { ascending: true });

      if (masculinoError) throw masculinoError;

      // Cargar partidos de Femenino
      const { data: femeninoData, error: femeninoError } = await supabase
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
          team2:teams!matches_team2_id_fkey (*),
          group:groups (name)
        `)
        .eq('category', 'Femenino')
        .eq('phase', 'group')
        .order('created_at', { ascending: true });

      if (femeninoError) throw femeninoError;

      setMasculinoMatches(masculinoData as any || []);
      setFemeninoMatches(femeninoData as any || []);
    } catch (error) {
      console.error("Error loading matches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMatchCards = (matches: Match[], category?: string) => {
    if (matches.length === 0) {
      return (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">No hay partidos programados</h3>
          <p className="text-sm text-muted-foreground">
            Los partidos aparecerán aquí cuando se generen desde el Gestor de Torneo
          </p>
        </div>
      );
    }

    // Agrupar partidos por grupo
    const groupedMatches: Record<string, Match[]> = {};
    matches.forEach(match => {
      const groupName = match.group?.name || 'Sin grupo';
      if (!groupedMatches[groupName]) {
        groupedMatches[groupName] = [];
      }
      groupedMatches[groupName].push(match);
    });

    const groupsArray = Object.entries(groupedMatches);
    const groupCount = groupsArray.length;

    // Si hay 2 grupos, mostrar en grid con mejor espaciado
    // EXCEPTO para Femenino, que siempre se muestra uno debajo del otro
    const isFemenino = category === 'Femenino' || (matches.length > 0 && matches[0].team1?.category === 'Femenino');
    const useGrid = groupCount === 2 && !isFemenino;

    return (
      <div className={useGrid ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-6'}>
        {groupsArray.map(([groupName, groupMatches], groupIndex) => (
          <div key={groupName} className={`min-w-0 ${groupIndex > 0 && !useGrid ? 'border-t-2 border-primary/20 pt-4' : ''}`}>
            <h3 className="text-base font-bold mb-3 text-primary flex items-center gap-2 break-words">
              <span className="h-1 w-8 bg-primary rounded-full flex-shrink-0"></span>
              <span className="break-words">{groupName}</span>
            </h3>
            <div className="grid gap-3">
              {groupMatches.map((match, index) => {
                const team1Sets = [
                  match.team1_set1 > match.team2_set1 ? 1 : 0,
                  match.team1_set2 > match.team2_set2 ? 1 : 0,
                  match.team1_set3 !== null && match.team2_set3 !== null
                    ? (match.team1_set3 > match.team2_set3 ? 1 : 0)
                    : 0
                ].reduce((a, b) => a + b, 0);

                const team2Sets = [
                  match.team2_set1 > match.team1_set1 ? 1 : 0,
                  match.team2_set2 > match.team1_set2 ? 1 : 0,
                  match.team2_set3 !== null && match.team1_set3 !== null
                    ? (match.team2_set3 > match.team1_set3 ? 1 : 0)
                    : 0
                ].reduce((a, b) => a + b, 0);

                const isCompleted = match.status === 'completed';

                return (
                  <Card
                    key={match.id}
                    className={`hover:shadow-md transition-all ${
                      isCompleted ? 'bg-green-50/50 border-green-400/40' : 'bg-slate-50/50'
                    }`}
                  >
                    <CardContent className="p-3">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        {/* Número de partido y estado */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Badge variant="outline" className="text-xs px-2 py-0.5">#{index + 1}</Badge>
                          <Badge variant={isCompleted ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0.5">
                            {isCompleted ? '✓' : '○'}
                          </Badge>
                        </div>

                        {/* Equipo 1 */}
                        <div className={`flex-1 min-w-0 px-3 py-2 rounded border flex items-center ${
                          isCompleted && match.winner_id === match.team1.id
                            ? 'bg-green-100 border-green-500 font-bold'
                            : 'bg-white/80'
                        }`}>
                          <p className="text-sm font-semibold truncate w-full" title={match.team1.name}>
                            {match.team1.name}
                          </p>
                        </div>

                        {/* Marcador compacto */}
                        {isCompleted ? (
                          <div className="flex items-center gap-1.5 min-w-[90px] sm:min-w-[110px] justify-center font-mono flex-shrink-0">
                            <div className="flex gap-0.5 text-xs sm:text-sm font-bold">
                              <span className={match.team1_set1 > match.team2_set1 ? 'text-green-600' : 'text-gray-600'}>{match.team1_set1}</span>
                              <span className="text-gray-400">-</span>
                              <span className={match.team2_set1 > match.team1_set1 ? 'text-green-600' : 'text-gray-600'}>{match.team2_set1}</span>
                            </div>
                            {match.team1_set2 !== null && match.team2_set2 !== null && (
                              <>
                                <span className="text-gray-300">|</span>
                                <div className="flex gap-0.5 text-xs sm:text-sm font-bold">
                                  <span className={match.team1_set2 > match.team2_set2 ? 'text-green-600' : 'text-gray-600'}>{match.team1_set2}</span>
                                  <span className="text-gray-400">-</span>
                                  <span className={match.team2_set2 > match.team1_set2 ? 'text-green-600' : 'text-gray-600'}>{match.team2_set2}</span>
                                </div>
                              </>
                            )}
                            {match.team1_set3 !== null && match.team2_set3 !== null && (
                              <>
                                <span className="text-gray-300">|</span>
                                <div className="flex gap-0.5 text-xs sm:text-sm font-bold">
                                  <span className={match.team1_set3 > match.team2_set3 ? 'text-green-600' : 'text-gray-600'}>{match.team1_set3}</span>
                                  <span className="text-gray-400">-</span>
                                  <span className={match.team2_set3 > match.team1_set3 ? 'text-green-600' : 'text-gray-600'}>{match.team2_set3}</span>
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="min-w-[90px] sm:min-w-[110px] text-center flex-shrink-0">
                            <span className="text-sm sm:text-base font-bold text-gray-400">VS</span>
                          </div>
                        )}

                        {/* Equipo 2 */}
                        <div className={`flex-1 min-w-0 px-3 py-2 rounded border flex items-center ${
                          isCompleted && match.winner_id === match.team2.id
                            ? 'bg-green-100 border-green-500 font-bold'
                            : 'bg-white/80'
                        }`}>
                          <p className="text-sm font-semibold truncate w-full" title={match.team2.name}>
                            {match.team2.name}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-padel-gradient flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Cargando partidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-padel-gradient">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!isPlayersMode && (
                <>
                  <Link to="/">
                    <Button variant="outline" size="sm">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Volver
                    </Button>
                  </Link>
                  <div className="h-8 w-px bg-border" />
                </>
              )}
              <div>
                <h1 className="text-2xl font-bold">
                  {isPlayersMode ? "Resultados del Torneo" : "Tabla de Partidos"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isPlayersMode
                    ? "Consulta todos los resultados y la tabla de posiciones"
                    : "Visualiza todos los partidos programados y sus resultados"
                  }
                </p>
              </div>
            </div>
            <img src={tournamentLogo} alt="White Padel" className="h-12 w-auto" />
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        <div className="space-y-6 max-w-[98vw] mx-auto">
          {/* Fila de Posiciones */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Columna Masculino - Posiciones */}
            <Card className="border-2 border-blue-400/50 bg-blue-50/30 min-w-0">
              <CardHeader className="bg-blue-100/50 py-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-lg font-bold">MASCULINO - POSICIONES</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {masculinoMatches.filter(m => m.status === 'completed').length}/{masculinoMatches.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 pb-4">
                {renderStandingsTable(masculinoMatches)}
              </CardContent>
            </Card>

            {/* Columna Femenino - Posiciones */}
            <Card className="border-2 border-pink-400/50 bg-pink-50/30 min-w-0">
              <CardHeader className="bg-pink-100/50 py-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-lg font-bold">FEMENINO - POSICIONES</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {femeninoMatches.filter(m => m.status === 'completed').length}/{femeninoMatches.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 pb-4">
                {renderStandingsTable(femeninoMatches)}
              </CardContent>
            </Card>
          </div>

          {/* Fila de Partidos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna Masculino - Partidos */}
            <Card className="border-2 border-blue-400/50 bg-blue-50/30 min-w-0">
              <CardHeader className="bg-blue-100/50 py-3">
                <CardTitle className="text-lg font-bold">MASCULINO - PARTIDOS</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 pb-4">
                {renderMatchCards(masculinoMatches, 'Masculino')}
              </CardContent>
            </Card>

            {/* Columna Femenino - Partidos */}
            <Card className="border-2 border-pink-400/50 bg-pink-50/30 min-w-0">
              <CardHeader className="bg-pink-100/50 py-3">
                <CardTitle className="text-lg font-bold">FEMENINO - PARTIDOS</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 pb-4">
                {renderMatchCards(femeninoMatches, 'Femenino')}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MatchesTable;
