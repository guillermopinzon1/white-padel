-- =====================================================
-- SIMPLIFICAR CATEGORÍAS A SOLO MASCULINO Y FEMENINO
-- =====================================================

-- Eliminar categorías antiguas
DELETE FROM categories WHERE name NOT IN ('Masculino', 'Femenino');

-- Insertar las dos categorías principales (si no existen)
INSERT INTO categories (name, description, max_teams) VALUES
    ('Masculino', 'Categoría Masculina', 32),
    ('Femenino', 'Categoría Femenina', 32)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    max_teams = EXCLUDED.max_teams;

-- Actualizar equipos existentes a las nuevas categorías (si hay datos previos)
UPDATE teams
SET category = 'Masculino'
WHERE category LIKE '%Masculino%' AND category != 'Masculino';

UPDATE teams
SET category = 'Femenino'
WHERE category LIKE '%Femenino%' AND category != 'Femenino';

-- Actualizar grupos existentes a las nuevas categorías
UPDATE groups
SET category = 'Masculino'
WHERE category LIKE '%Masculino%' AND category != 'Masculino';

UPDATE groups
SET category = 'Femenino'
WHERE category LIKE '%Femenino%' AND category != 'Femenino';

-- Actualizar partidos existentes a las nuevas categorías
UPDATE matches
SET category = 'Masculino'
WHERE category LIKE '%Masculino%' AND category != 'Masculino';

UPDATE matches
SET category = 'Femenino'
WHERE category LIKE '%Femenino%' AND category != 'Femenino';

-- Verificar las categorías actuales
SELECT * FROM categories ORDER BY name;
