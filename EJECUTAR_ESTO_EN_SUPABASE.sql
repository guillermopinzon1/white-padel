-- =====================================================
-- PASO 1: Eliminar categorías antiguas
-- =====================================================
DELETE FROM categories;

-- =====================================================
-- PASO 2: Insertar las dos categorías nuevas
-- =====================================================
INSERT INTO categories (name, description, max_teams) VALUES
    ('Masculino', 'Categoría Masculina', 32),
    ('Femenino', 'Categoría Femenina', 32);

-- =====================================================
-- PASO 3: Verificar que se crearon correctamente
-- =====================================================
SELECT * FROM categories ORDER BY name;

-- =====================================================
-- RESULTADO ESPERADO:
-- Deberías ver 2 filas:
-- 1. Femenino
-- 2. Masculino
-- =====================================================
