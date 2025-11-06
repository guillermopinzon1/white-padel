# 📅 Módulo de Gestión de Partidos

## 🎯 Características Principales

El nuevo módulo de **Gestión de Partidos** permite:

1. ✅ Ver todos los grupos creados por categoría
2. ✅ Generar partidos automáticamente (sistema Round-Robin: todos contra todos)
3. ✅ Ver cuántos partidos totales hay en cada grupo
4. ✅ Ingresar y editar resultados de partidos
5. ✅ Guardar todo en Supabase
6. ✅ Actualización automática de la tabla de posiciones

---

## 🚀 Cómo Usar

### Paso 1: Acceder al Módulo

Desde la página principal:
- Click en **"Gestión de Partidos"**
- O ve directamente a: http://localhost:8081/matches

### Paso 2: Seleccionar Categoría y Grupo

1. **Selecciona una Categoría**: Por ejemplo "5ta Masculino"
2. **Selecciona un Grupo**: Por ejemplo "Grupo A"
3. Se mostrará información del grupo:
   - 👥 Equipos en el grupo
   - 📅 Partidos totales posibles
   - 🏆 Partidos ya generados

### Paso 3: Generar Partidos

**Sistema Round-Robin (Todos contra Todos)**

Si tienes 4 equipos en el grupo:
- Equipo A vs Equipo B
- Equipo A vs Equipo C
- Equipo A vs Equipo D
- Equipo B vs Equipo C
- Equipo B vs Equipo D
- Equipo C vs Equipo D

**Total: 6 partidos** (fórmula: n*(n-1)/2)

1. Click en **"Generar Partidos"**
2. El sistema creará automáticamente TODOS los partidos posibles
3. Los partidos se guardan en Supabase

### Paso 4: Ingresar Resultados

Para cada partido:

1. Click en **"Ingresar Resultado"**
2. Aparecerán campos para los sets:
   - **Set 1**: Ej: 6-4
   - **Set 2**: Ej: 7-5
   - **Set 3** (opcional): Solo si fue necesario

3. Ingresa los games de cada set
4. Click en **"Guardar Resultado"**

El sistema automáticamente:
- ✅ Calcula quién ganó
- ✅ Actualiza el estado del partido a "Completado"
- ✅ Actualiza la tabla de posiciones (standings)
- ✅ Suma puntos a los equipos

### Paso 5: Editar Resultados

Si cometiste un error:
1. Click en **"Editar Resultado"**
2. Modifica los valores
3. Click en **"Guardar Resultado"**

---

## 📊 Información que Muestra

Para cada partido verás:

### Información Básica
- Número del partido (1, 2, 3...)
- Estado: "Pendiente" o "Finalizado"
- Equipos participantes
- Nombres de los jugadores

### Resultados
- Sets ganados por cada equipo
- Games de cada set
- Equipo ganador (con badge de trofeo)

---

## 🧮 Cálculo de Partidos

El sistema calcula automáticamente cuántos partidos habrá según el número de equipos:

| Equipos | Partidos | Fórmula |
|---------|----------|---------|
| 2       | 1        | 2×1/2   |
| 3       | 3        | 3×2/2   |
| 4       | 6        | 4×3/2   |
| 5       | 10       | 5×4/2   |
| 6       | 15       | 6×5/2   |
| 8       | 28       | 8×7/2   |

**Fórmula general**: `n × (n-1) / 2`

Donde `n` = número de equipos en el grupo

---

## 💾 Datos Guardados en Supabase

Cada partido guarda:

```typescript
{
  category: "5ta Masculino",
  phase: "group",
  group_id: "uuid-del-grupo",
  team1_id: "uuid-equipo-1",
  team2_id: "uuid-equipo-2",
  team1_set1: 6,
  team1_set2: 7,
  team1_set3: null,
  team2_set1: 4,
  team2_set2: 5,
  team2_set3: null,
  winner_id: "uuid-del-ganador",
  status: "completed",
  match_date: "2025-11-03T...",
  court_number: null
}
```

---

## 🎨 Diseño

El módulo mantiene el mismo estilo moderno y limpio:
- 🎨 Colores: Negro, gris y blanco
- ✨ Animaciones sutiles
- 📱 Responsive (funciona en móvil)
- 🔄 Estados de carga claros

---

## 🔄 Flujo de Trabajo Completo

### 1. Crear Equipos
`/category/5-masculino` → Agregar duplas

### 2. Crear Grupos
`/groups` → Generar grupos y guardar en Supabase

### 3. Generar Partidos
`/matches` → Seleccionar grupo y generar partidos

### 4. Ingresar Resultados
`/matches` → Ir partido por partido ingresando resultados

### 5. Ver Tabla de Posiciones
`/standings` → Ver clasificación actualizada automáticamente

### 6. Generar Eliminatorias
`/brackets` → Cuartos, semis y final (próximamente)

---

## ⚠️ Notas Importantes

### No Puedes Generar Partidos si:
- ❌ El grupo no tiene equipos
- ❌ El grupo tiene menos de 2 equipos
- ❌ Ya se generaron partidos para ese grupo

### Solución:
Si necesitas regenerar partidos, debes eliminar los existentes desde Supabase:
1. Ve a Supabase → Tabla `matches`
2. Filtra por `group_id`
3. Elimina los partidos
4. Genera nuevamente

### Actualización Automática:
Cuando completas un partido, el trigger de Supabase automáticamente:
- Actualiza `standings` (tabla de posiciones)
- Suma partidos jugados
- Suma victorias/derrotas
- Calcula sets y games
- Asigna puntos (3 puntos por victoria)

---

## 🐛 Solución de Problemas

### No aparecen grupos
**Solución**: Primero genera grupos en `/groups`

### Error al generar partidos
**Solución**: Verifica que el grupo tenga al menos 2 equipos

### No se guarda el resultado
**Solución**: Verifica que ingresaste los sets correctamente

### La tabla de posiciones no se actualiza
**Solución**: Verifica que el trigger `update_standings_on_match_complete` esté creado en Supabase

---

## 📱 Pantallas

### Vista Principal
- Filtros de categoría y grupo
- Información de equipos y partidos
- Botón para generar partidos

### Lista de Partidos
- Cards modernas con información de cada partido
- Estados visuales claros
- Badges para ganadores

### Edición de Resultados
- Inputs numéricos para cada set
- Validación automática
- Guardado en tiempo real

---

¡Todo listo! Ahora puedes gestionar todos los partidos de tu torneo de forma profesional 🎾
