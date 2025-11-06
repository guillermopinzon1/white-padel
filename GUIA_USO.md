# 📋 Guía de Uso - White Padel Tournament

## 🎯 Sistema Simplificado

El sistema ahora está simplificado para manejar solo **2 categorías**:
- ⚪ **Masculino**
- ⚪ **Femenino**

## 🚀 Pasos para Configurar tu Torneo

### 1️⃣ Actualizar Base de Datos

Primero, ejecuta el script SQL para actualizar las categorías en Supabase:

```bash
# Abre Supabase SQL Editor y ejecuta:
white-padel-ace/update-simple-categories.sql
```

Esto eliminará las categorías antiguas y creará solo "Masculino" y "Femenino".

### 2️⃣ Agregar Duplas a Cada Categoría

1. Ve a la página principal
2. Haz clic en la categoría que desees (Masculino o Femenino)
3. Usa el botón **"Agregar Dupla"** para registrar parejas
4. Llena los datos:
   - Nombre del equipo (opcional)
   - Jugador 1
   - Jugador 2

### 3️⃣ Usar el Gestor de Torneo (⚡ NUEVO)

El **Gestor de Torneo** es el módulo principal que te permite hacer todo en un solo lugar:

#### Paso 1: Seleccionar Categoría
- Elige Masculino o Femenino
- Verás cuántas duplas hay disponibles

#### Paso 2: Configurar Grupos
- Haz clic en **"Configurar"**
- Define el número de grupos (por ejemplo, 2, 3, o 4 grupos)
- Haz clic en **"Generar"**
- El sistema distribuirá las duplas automáticamente de forma aleatoria

#### Paso 3: Ajustar Grupos (Drag & Drop)
- **¡Súper flexible!** Puedes arrastrar y soltar duplas entre grupos
- Simplemente arrastra una dupla de un grupo a otro
- Reorganiza como quieras antes de generar los partidos

#### Paso 4: Generar Partidos
- Una vez que estés satisfecho con los grupos, haz clic en **"Generar Partidos"**
- El sistema creará automáticamente **todos los partidos** (todos contra todos dentro de cada grupo)
- Cada dupla jugará contra todas las demás duplas de su grupo

#### Paso 5: Editar Resultados
- Verás todos los partidos organizados por grupo
- Haz clic en el botón **"Editar"** (lápiz) de cualquier partido
- Ingresa los resultados:
  - Set 1: Juegos de cada equipo
  - Set 2: Juegos de cada equipo
  - Set 3 (opcional): Solo si hubo tercer set
- Haz clic en **"Calcular Ganador"** para determinar automáticamente el ganador
- Guarda los cambios

#### Paso 6: Guardar Todo
- Cuando hayas terminado de configurar, haz clic en **"Guardar Todo"**
- Esto guardará todos los grupos y partidos en Supabase
- Los resultados que hayas ingresado también se guardarán

## 🎮 Características del Nuevo Sistema

### ✅ Ventajas

1. **Todo en un solo lugar**: No necesitas ir a múltiples páginas
2. **Drag & Drop**: Mueve duplas entre grupos fácilmente
3. **Configuración flexible**: Cambia el número de grupos cuando quieras
4. **Vista clara**: Ves todos los grupos y partidos organizados
5. **Edición simple**: Edita resultados con una interfaz limpia
6. **Guardado inteligente**: Solo guarda cuando tú lo decidas

### 🔄 Flujo de Trabajo Recomendado

```
1. Agregar todas las duplas de una categoría
   ↓
2. Abrir Gestor de Torneo
   ↓
3. Seleccionar la categoría
   ↓
4. Configurar grupos (número de grupos)
   ↓
5. Generar grupos automáticamente
   ↓
6. Ajustar duplas entre grupos (drag & drop) si es necesario
   ↓
7. Generar partidos (todos contra todos)
   ↓
8. Revisar los partidos generados
   ↓
9. Guardar todo en la base de datos
   ↓
10. Durante el torneo: editar resultados de cada partido
   ↓
11. Guardar cambios después de actualizar resultados
```

## 📊 Ejemplos de Configuración

### Ejemplo 1: 8 Duplas en 2 Grupos
- 2 grupos de 4 duplas cada uno
- Cada dupla juega 3 partidos (contra las otras 3 de su grupo)
- Total: 12 partidos (6 por grupo)

### Ejemplo 2: 12 Duplas en 3 Grupos
- 3 grupos de 4 duplas cada uno
- Cada dupla juega 3 partidos
- Total: 18 partidos (6 por grupo)

### Ejemplo 3: 10 Duplas en 2 Grupos Desiguales
- Grupo A: 5 duplas (10 partidos)
- Grupo B: 5 duplas (10 partidos)
- Total: 20 partidos

## 🔧 Módulos Adicionales (Opcionales)

El sistema también conserva los módulos anteriores por si los necesitas:

- **Gestión de Grupos**: Método alternativo para crear grupos manualmente
- **Gestión de Partidos**: Ver y editar partidos de forma tradicional
- **Tabla de Posiciones**: Ver estadísticas y puntos de cada equipo
- **Eliminatorias**: Gestionar cuartos, semis y final

## 💡 Consejos

1. **Guarda frecuentemente**: Haz clic en "Guardar Todo" después de hacer cambios importantes
2. **Prueba primero**: Genera grupos de prueba para familiarizarte con el sistema
3. **Reorganiza libremente**: No tengas miedo de mover duplas entre grupos antes de generar partidos
4. **Edita resultados durante el torneo**: Puedes ir agregando resultados conforme se juegan los partidos
5. **Verifica antes de guardar**: Revisa que todo esté correcto antes de hacer el guardado final

## 🆘 Solución de Problemas

**P: ¿Qué pasa si me equivoco en la configuración de grupos?**
R: Simplemente vuelve a hacer clic en "Configurar" y genera nuevos grupos. Los cambios no se guardan hasta que hagas clic en "Guardar Todo".

**P: ¿Puedo cambiar el número de partidos por grupo?**
R: Los partidos se generan automáticamente como "todos contra todos". Si quieres menos partidos, deberás eliminar algunos manualmente después de generarlos.

**P: ¿Cómo agrego más duplas después de crear los grupos?**
R: Ve a la página de la categoría, agrega las nuevas duplas, y luego vuelve al Gestor de Torneo para reconfigurar los grupos.

**P: ¿Los resultados se guardan automáticamente?**
R: No, debes hacer clic en "Guardar Todo" para que los cambios se guarden en Supabase.

## 📞 Soporte

Si tienes dudas o encuentras algún problema, revisa:
1. La consola del navegador (F12) para ver errores
2. Supabase Dashboard para verificar que los datos se guardaron
3. Este documento para recordar el flujo de trabajo

---

¡Disfruta tu torneo! 🎾 🏆
