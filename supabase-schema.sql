-- =====================================================
-- WHITE PADEL ACE - SCHEMA DE BASE DE DATOS
-- Sistema completo de torneo de pádel
-- =====================================================

-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: teams (Duplas/Parejas)
-- =====================================================
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    player1_name VARCHAR(255) NOT NULL,
    player2_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- Ej: "Masculino A", "Femenino B", etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA: groups (Grupos para fase de grupos)
-- =====================================================
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL, -- Ej: "Grupo A", "Grupo B"
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA: group_teams (Relación equipos-grupos)
-- =====================================================
CREATE TABLE group_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, team_id)
);

-- =====================================================
-- TABLA: matches (Partidos)
-- =====================================================
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL,
    phase VARCHAR(50) NOT NULL, -- "group", "quarterfinals", "semifinals", "final"
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
    team1_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    team2_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    team1_set1 INTEGER DEFAULT 0,
    team1_set2 INTEGER DEFAULT 0,
    team1_set3 INTEGER DEFAULT 0,
    team2_set1 INTEGER DEFAULT 0,
    team2_set2 INTEGER DEFAULT 0,
    team2_set3 INTEGER DEFAULT 0,
    winner_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    match_date TIMESTAMP WITH TIME ZONE,
    court_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending', -- "pending", "in_progress", "completed"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA: standings (Tabla de posiciones por grupo)
-- =====================================================
CREATE TABLE standings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    played INTEGER DEFAULT 0,
    won INTEGER DEFAULT 0,
    lost INTEGER DEFAULT 0,
    sets_won INTEGER DEFAULT 0,
    sets_lost INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    games_lost INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0, -- Puntos en la tabla
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, team_id)
);

-- =====================================================
-- TABLA: tournaments (Información general del torneo)
-- =====================================================
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'upcoming', -- "upcoming", "in_progress", "completed"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA: prizes (Premios del torneo)
-- =====================================================
CREATE TABLE prizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    position VARCHAR(50) NOT NULL, -- "1st", "2nd", "3rd", "semifinalist"
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    prize_amount DECIMAL(10, 2),
    prize_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA: categories (Categorías del torneo)
-- =====================================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    max_teams INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES para mejorar rendimiento
-- =====================================================
CREATE INDEX idx_teams_category ON teams(category);
CREATE INDEX idx_groups_category ON groups(category);
CREATE INDEX idx_matches_phase ON matches(phase);
CREATE INDEX idx_matches_category ON matches(category);
CREATE INDEX idx_matches_winner ON matches(winner_id);
CREATE INDEX idx_standings_group ON standings(group_id);
CREATE INDEX idx_standings_points ON standings(points DESC);
CREATE INDEX idx_group_teams_group ON group_teams(group_id);
CREATE INDEX idx_group_teams_team ON group_teams(team_id);

-- =====================================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS para updated_at
-- =====================================================
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_standings_updated_at BEFORE UPDATE ON standings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prizes_updated_at BEFORE UPDATE ON prizes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCIÓN: Actualizar tabla de posiciones después de un partido
-- =====================================================
CREATE OR REPLACE FUNCTION update_standings_after_match()
RETURNS TRIGGER AS $$
DECLARE
    team1_sets INTEGER;
    team2_sets INTEGER;
    team1_games INTEGER;
    team2_games INTEGER;
BEGIN
    -- Solo actualizar si el partido está completado
    IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL THEN
        -- Calcular sets ganados
        team1_sets := 0;
        team2_sets := 0;

        IF NEW.team1_set1 > NEW.team2_set1 THEN team1_sets := team1_sets + 1; ELSE team2_sets := team2_sets + 1; END IF;
        IF NEW.team1_set2 > NEW.team2_set2 THEN team1_sets := team1_sets + 1; ELSE team2_sets := team2_sets + 1; END IF;
        IF NEW.team1_set3 IS NOT NULL AND NEW.team2_set3 IS NOT NULL THEN
            IF NEW.team1_set3 > NEW.team2_set3 THEN team1_sets := team1_sets + 1; ELSE team2_sets := team2_sets + 1; END IF;
        END IF;

        -- Calcular juegos totales
        team1_games := COALESCE(NEW.team1_set1, 0) + COALESCE(NEW.team1_set2, 0) + COALESCE(NEW.team1_set3, 0);
        team2_games := COALESCE(NEW.team2_set1, 0) + COALESCE(NEW.team2_set2, 0) + COALESCE(NEW.team2_set3, 0);

        -- Actualizar equipo 1
        UPDATE standings SET
            played = played + 1,
            won = CASE WHEN NEW.winner_id = NEW.team1_id THEN won + 1 ELSE won END,
            lost = CASE WHEN NEW.winner_id != NEW.team1_id THEN lost + 1 ELSE lost END,
            sets_won = sets_won + team1_sets,
            sets_lost = sets_lost + team2_sets,
            games_won = games_won + team1_games,
            games_lost = games_lost + team2_games,
            points = CASE WHEN NEW.winner_id = NEW.team1_id THEN points + 3 ELSE points END
        WHERE group_id = NEW.group_id AND team_id = NEW.team1_id;

        -- Actualizar equipo 2
        UPDATE standings SET
            played = played + 1,
            won = CASE WHEN NEW.winner_id = NEW.team2_id THEN won + 1 ELSE won END,
            lost = CASE WHEN NEW.winner_id != NEW.team2_id THEN lost + 1 ELSE lost END,
            sets_won = sets_won + team2_sets,
            sets_lost = sets_lost + team1_sets,
            games_won = games_won + team2_games,
            games_lost = games_lost + team1_games,
            points = CASE WHEN NEW.winner_id = NEW.team2_id THEN points + 3 ELSE points END
        WHERE group_id = NEW.group_id AND team_id = NEW.team2_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Actualizar standings cuando se complete un partido
-- =====================================================
CREATE TRIGGER update_standings_on_match_complete
    AFTER UPDATE ON matches
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
    EXECUTE FUNCTION update_standings_after_match();

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================
-- Habilitar RLS en todas las tablas
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública (todos pueden leer)
CREATE POLICY "Enable read access for all users" ON teams FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON groups FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON group_teams FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON matches FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON standings FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON prizes FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON categories FOR SELECT USING (true);

-- Políticas de escritura (todos pueden insertar/actualizar por ahora)
-- NOTA: En producción, deberías restringir esto solo a administradores autenticados
CREATE POLICY "Enable insert for all users" ON teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON teams FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON teams FOR DELETE USING (true);

CREATE POLICY "Enable insert for all users" ON groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON groups FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON groups FOR DELETE USING (true);

CREATE POLICY "Enable insert for all users" ON group_teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON group_teams FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON group_teams FOR DELETE USING (true);

CREATE POLICY "Enable insert for all users" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON matches FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON matches FOR DELETE USING (true);

CREATE POLICY "Enable insert for all users" ON standings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON standings FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON standings FOR DELETE USING (true);

CREATE POLICY "Enable insert for all users" ON tournaments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON tournaments FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON tournaments FOR DELETE USING (true);

CREATE POLICY "Enable insert for all users" ON prizes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON prizes FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON prizes FOR DELETE USING (true);

CREATE POLICY "Enable insert for all users" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON categories FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON categories FOR DELETE USING (true);

-- =====================================================
-- DATOS INICIALES (OPCIONAL)
-- =====================================================
-- Insertar categorías por defecto
INSERT INTO categories (name, description, max_teams) VALUES
    ('Masculino A', 'Categoría masculina nivel avanzado', 16),
    ('Masculino B', 'Categoría masculina nivel intermedio', 16),
    ('Femenino A', 'Categoría femenina nivel avanzado', 16),
    ('Femenino B', 'Categoría femenina nivel intermedio', 16),
    ('Mixto', 'Categoría mixta', 16)
ON CONFLICT (name) DO NOTHING;
