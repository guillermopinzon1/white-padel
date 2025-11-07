-- Agregar columna 'position' a la tabla matches para ordenar brackets de eliminatorias
-- Esta columna ayuda a mantener el orden de los partidos en cuartos, semis y final

ALTER TABLE matches
ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Comentario para documentar
COMMENT ON COLUMN matches.position IS 'Posición del partido dentro de su fase (0, 1, 2, 3 para cuartos de final)';
