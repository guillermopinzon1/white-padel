# 🎾 Configuración de Supabase - White Padel Ace

## ✅ Configuración Completada

Tu proyecto ya está configurado para usar Supabase. Aquí está lo que se ha hecho:

### 1. Dependencias Instaladas ✓
- `@supabase/supabase-js` - Cliente de Supabase

### 2. Archivos Creados ✓

#### Variables de Entorno (`.env`)
```env
VITE_SUPABASE_URL=https://xxykyokmuzxjmvsiyxmg.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

#### Cliente de Supabase (`src/lib/supabase.ts`)
Cliente configurado y listo para usar en toda la aplicación.

#### Tipos TypeScript (`src/lib/database.types.ts`)
Tipos generados para todas las tablas de la base de datos.

#### Hooks Personalizados (`src/hooks/useSupabase.ts`)
Hooks listos para usar con React Query:
- `useTeams()` - Obtener duplas
- `useCreateTeam()` - Crear dupla
- `useGroups()` - Obtener grupos
- `useMatches()` - Obtener partidos
- `useStandings()` - Obtener tabla de posiciones
- `usePrizes()` - Obtener premios
- `useCategories()` - Obtener categorías

## 🗄️ Estructura de la Base de Datos

El archivo `supabase-schema.sql` contiene el esquema completo con:

### Tablas Principales:

1. **teams** (Duplas/Parejas)
   - Información de los equipos
   - Jugador 1 y Jugador 2
   - Categoría

2. **groups** (Grupos)
   - Grupos para fase de grupos
   - Asignados por categoría

3. **group_teams** (Relación Equipos-Grupos)
   - Vincula equipos con sus grupos

4. **matches** (Partidos)
   - Información completa de partidos
   - Sets y juegos
   - Fase del torneo (group, quarterfinals, semifinals, final)
   - Ganador

5. **standings** (Tabla de Posiciones)
   - Puntos, partidos jugados
   - Sets ganados/perdidos
   - Juegos ganados/perdidos
   - **Se actualiza automáticamente** cuando se completa un partido

6. **tournaments** (Torneos)
   - Información general del torneo
   - Fechas y ubicación

7. **prizes** (Premios)
   - Premios por posición
   - Montos y descripciones
   - Vinculados a equipos ganadores

8. **categories** (Categorías)
   - Categorías del torneo
   - Cantidad máxima de equipos

## 🚀 Pasos para Completar la Configuración

### 1. Crear las Tablas en Supabase

1. Ve a tu proyecto en [Supabase](https://app.supabase.com/project/xxykyokmuzxjmvsiyxmg)
2. Click en **SQL Editor** en el menú lateral
3. Click en **New Query**
4. Copia y pega todo el contenido del archivo `supabase-schema.sql`
5. Click en **Run** para ejecutar el script

¡Esto creará todas las tablas, índices, triggers y políticas de seguridad!

### 2. Verificar las Tablas

1. Ve a **Table Editor** en Supabase
2. Deberías ver todas estas tablas:
   - teams
   - groups
   - group_teams
   - matches
   - standings
   - tournaments
   - prizes
   - categories

### 3. Verificar Datos Iniciales

El script ya insertó categorías por defecto:
- Masculino A
- Masculino B
- Femenino A
- Femenino B
- Mixto

## 📝 Cómo Usar en tu Código

### Ejemplo 1: Obtener Equipos
```typescript
import { useTeams } from '@/hooks/useSupabase';

function MyComponent() {
  const { data: teams, isLoading } = useTeams('Masculino A');

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div>
      {teams?.map(team => (
        <div key={team.id}>
          {team.name}: {team.player1_name} & {team.player2_name}
        </div>
      ))}
    </div>
  );
}
```

### Ejemplo 2: Crear un Equipo
```typescript
import { useCreateTeam } from '@/hooks/useSupabase';
import { toast } from 'sonner';

function CreateTeamForm() {
  const createTeam = useCreateTeam();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      await createTeam.mutateAsync({
        name: "Los Campeones",
        player1_name: "Juan Pérez",
        player2_name: "Carlos López",
        category: "Masculino A"
      });
      toast.success('Equipo creado exitosamente!');
    } catch (error) {
      toast.error('Error al crear equipo');
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Ejemplo 3: Ver Tabla de Posiciones
```typescript
import { useStandings } from '@/hooks/useSupabase';

function StandingsTable({ groupId }: { groupId: string }) {
  const { data: standings } = useStandings(groupId);

  return (
    <table>
      <thead>
        <tr>
          <th>Pos</th>
          <th>Equipo</th>
          <th>PJ</th>
          <th>PG</th>
          <th>PP</th>
          <th>Pts</th>
        </tr>
      </thead>
      <tbody>
        {standings?.map((standing, index) => (
          <tr key={standing.id}>
            <td>{index + 1}</td>
            <td>{standing.team.name}</td>
            <td>{standing.played}</td>
            <td>{standing.won}</td>
            <td>{standing.lost}</td>
            <td>{standing.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Ejemplo 4: Actualizar Resultado de Partido
```typescript
import { useUpdateMatch } from '@/hooks/useSupabase';

function MatchResult({ matchId }: { matchId: string }) {
  const updateMatch = useUpdateMatch();

  const handleComplete = async () => {
    await updateMatch.mutateAsync({
      id: matchId,
      team1_set1: 6,
      team1_set2: 7,
      team2_set1: 4,
      team2_set2: 5,
      winner_id: 'team1-uuid',
      status: 'completed'
    });
    // ¡La tabla de posiciones se actualiza automáticamente!
  };

  return <button onClick={handleComplete}>Completar Partido</button>;
}
```

## 🔄 Funcionalidades Automáticas

### 1. Actualización Automática de Standings
Cuando un partido se marca como "completed":
- Se actualizan automáticamente los puntos
- Se cuentan partidos ganados/perdidos
- Se suman sets y juegos
- Todo esto gracias al trigger `update_standings_on_match_complete`

### 2. Timestamps Automáticos
- `created_at` se establece automáticamente al crear
- `updated_at` se actualiza automáticamente al modificar

### 3. Row Level Security (RLS)
- Todos pueden **leer** datos (perfecto para mostrar información)
- Todos pueden **escribir** datos (en producción, cambiar esto a solo admins)

## 🎯 Próximos Pasos

1. ✅ Ejecutar el SQL en Supabase
2. 🎨 Integrar los hooks en tus componentes existentes
3. 🔐 (Opcional) Configurar autenticación para administradores
4. 📊 Crear dashboards con los datos

## 🐛 Solución de Problemas

### Error: "Missing Supabase environment variables"
- Verifica que el archivo `.env` esté en la raíz del proyecto
- Reinicia el servidor de desarrollo (`npm run dev`)

### Error: "relation does not exist"
- Asegúrate de haber ejecutado el SQL en Supabase
- Verifica que las tablas se crearon correctamente

### Error de tipos TypeScript
- Los tipos en `database.types.ts` coinciden con tu esquema
- Si modificas el esquema, actualiza los tipos

## 📚 Recursos

- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de React Query](https://tanstack.com/query/latest/docs/react/overview)
- [Dashboard de tu proyecto](https://app.supabase.com/project/xxykyokmuzxjmvsiyxmg)

---

¡Todo listo! 🎉 Tu proyecto está conectado a Supabase y listo para gestionar torneos de pádel.
