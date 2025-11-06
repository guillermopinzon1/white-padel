import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Team = Database['public']['Tables']['teams']['Row'];
type TeamInsert = Database['public']['Tables']['teams']['Insert'];
type Group = Database['public']['Tables']['groups']['Row'];
type Match = Database['public']['Tables']['matches']['Row'];
type Standing = Database['public']['Tables']['standings']['Row'];
type Prize = Database['public']['Tables']['prizes']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

// =====================================================
// TEAMS (Duplas)
// =====================================================
export const useTeams = (category?: string) => {
  return useQuery({
    queryKey: ['teams', category],
    queryFn: async () => {
      let query = supabase.from('teams').select('*');
      if (category) {
        query = query.eq('category', category);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as Team[];
    },
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (team: TeamInsert) => {
      const { data, error } = await supabase.from('teams').insert(team).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

export const useUpdateTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Team> & { id: string }) => {
      const { data, error } = await supabase.from('teams').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('teams').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

// =====================================================
// GROUPS (Grupos)
// =====================================================
export const useGroups = (category?: string) => {
  return useQuery({
    queryKey: ['groups', category],
    queryFn: async () => {
      let query = supabase.from('groups').select('*, group_teams(*, teams(*))');
      if (category) {
        query = query.eq('category', category);
      }
      const { data, error } = await query.order('name', { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });
};

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (group: { name: string; category: string }) => {
      const { data, error } = await supabase.from('groups').insert(group).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
};

export const useAddTeamToGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, teamId }: { groupId: string; teamId: string }) => {
      // Añadir equipo al grupo
      const { data: groupTeam, error: groupTeamError } = await supabase
        .from('group_teams')
        .insert({ group_id: groupId, team_id: teamId })
        .select()
        .single();

      if (groupTeamError) throw groupTeamError;

      // Crear entrada en standings
      const { data: standing, error: standingError } = await supabase
        .from('standings')
        .insert({ group_id: groupId, team_id: teamId })
        .select()
        .single();

      if (standingError) throw standingError;

      return { groupTeam, standing };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['standings'] });
    },
  });
};

// =====================================================
// MATCHES (Partidos)
// =====================================================
export const useMatches = (phase?: string, category?: string) => {
  return useQuery({
    queryKey: ['matches', phase, category],
    queryFn: async () => {
      let query = supabase.from('matches').select(`
        *,
        team1:teams!matches_team1_id_fkey(*),
        team2:teams!matches_team2_id_fkey(*),
        winner:teams!matches_winner_id_fkey(*),
        group:groups(*)
      `);

      if (phase) query = query.eq('phase', phase);
      if (category) query = query.eq('category', category);

      const { data, error } = await query.order('match_date', { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });
};

export const useCreateMatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (match: Database['public']['Tables']['matches']['Insert']) => {
      const { data, error } = await supabase.from('matches').insert(match).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
};

export const useUpdateMatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Match> & { id: string }) => {
      const { data, error } = await supabase.from('matches').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['standings'] });
    },
  });
};

// =====================================================
// STANDINGS (Tabla de posiciones)
// =====================================================
export const useStandings = (groupId?: string) => {
  return useQuery({
    queryKey: ['standings', groupId],
    queryFn: async () => {
      let query = supabase.from('standings').select(`
        *,
        team:teams(*),
        group:groups(*)
      `);

      if (groupId) {
        query = query.eq('group_id', groupId);
      }

      const { data, error } = await query.order('points', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
};

// =====================================================
// PRIZES (Premios)
// =====================================================
export const usePrizes = (category?: string) => {
  return useQuery({
    queryKey: ['prizes', category],
    queryFn: async () => {
      let query = supabase.from('prizes').select(`
        *,
        team:teams(*)
      `);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('position', { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });
};

export const useCreatePrize = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prize: Database['public']['Tables']['prizes']['Insert']) => {
      const { data, error } = await supabase.from('prizes').insert(prize).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prizes'] });
    },
  });
};

export const useUpdatePrize = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Prize> & { id: string }) => {
      const { data, error } = await supabase.from('prizes').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prizes'] });
    },
  });
};

// =====================================================
// CATEGORIES (Categorías)
// =====================================================
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });
      if (error) throw error;
      return data as Category[];
    },
  });
};
