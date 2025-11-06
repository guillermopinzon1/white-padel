-- =====================================================
-- ACTUALIZAR CATEGORÍAS PARA WHITE PADEL ACE
-- Elimina las categorías antiguas y crea las correctas
-- =====================================================

-- Eliminar categorías antiguas (si existen)
DELETE FROM categories;

-- Insertar las categorías correctas
INSERT INTO categories (name, description, max_teams) VALUES
    ('5ta Masculino', 'Quinta categoría masculino', 16),
    ('5ta Femenino', 'Quinta categoría femenino', 16),
    ('6ta Masculino', 'Sexta categoría masculino', 16),
    ('6ta Femenino', 'Sexta categoría femenino', 16),
    ('7ta Masculino', 'Séptima categoría masculino', 16),
    ('7ta Femenino', 'Séptima categoría femenino', 16)
ON CONFLICT (name) DO NOTHING;

-- Verificar que se crearon correctamente
SELECT * FROM categories ORDER BY name;
