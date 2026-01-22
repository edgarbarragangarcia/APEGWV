-- Migration: Populate Course Holes with Standard Data
-- Purpose: Seed database with Par and Handicap data for Smart Caddie functionality

-- function to quickly insert 18 holes
CREATE OR REPLACE FUNCTION seed_course_holes(
    p_course_id TEXT, 
    p_recorrido TEXT, 
    p_pars INT[], 
    p_handicaps INT[]
) RETURNS VOID AS $$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..18 LOOP
        INSERT INTO public.course_holes (id, course_id, recorrido, hole_number, par, handicap)
        VALUES (
            uuid_generate_v5(uuid_ns_url(), p_course_id || '-' || p_recorrido || '-' || i), -- Consistent UUID based on data
            p_course_id,
            p_recorrido,
            i,
            p_pars[i],
            p_handicaps[i]
        )
        ON CONFLICT (course_id, recorrido, hole_number) 
        DO UPDATE SET par = EXCLUDED.par, handicap = EXCLUDED.handicap;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 1. Country Club de Bogotá - Fundadores (Par 72)
-- Un campo exigente, hoyos largos y greenes rápidos.
SELECT seed_course_holes(
    'country-fundadores', 
    'Fundadores',
    ARRAY[4, 5, 4, 3, 4, 4, 3, 4, 5,  4, 4, 3, 5, 4, 4, 3, 4, 5], -- Standard Par 72 distribution
    ARRAY[9, 3, 7, 15, 1, 11, 17, 5, 13,  10, 2, 16, 8, 4, 12, 18, 6, 14] -- Distributed Odd/Even Hcps
);

-- 2. Country Club de Bogotá - Pacos y Fabios (Par 70 - Campo más corto)
SELECT seed_course_holes(
    'country-fundadores', 
    'Pacos y Fabios',
    ARRAY[4, 3, 4, 4, 3, 4, 4, 3, 4,  4, 3, 4, 5, 3, 4, 4, 4, 4], 
    ARRAY[11, 15, 5, 1, 17, 7, 9, 13, 3,  12, 16, 6, 2, 18, 8, 10, 4, 14]
);

-- 3. Club Los Lagartos - David Gutiérrez (Par 72)
SELECT seed_course_holes(
    'lagartos-david', 
    'David Gutiérrez',
    ARRAY[5, 4, 3, 4, 4, 4, 3, 5, 4,  4, 5, 3, 4, 4, 3, 4, 5, 4], 
    ARRAY[11, 1, 15, 5, 9, 7, 17, 13, 3,  10, 8, 18, 2, 6, 16, 12, 14, 4]
);

-- 4. Club Los Lagartos - Corea (Par 71)
SELECT seed_course_holes(
    'lagartos-david', 
    'Corea',
    ARRAY[4, 4, 3, 5, 4, 3, 4, 4, 4,  5, 3, 4, 4, 4, 3, 5, 4, 4], 
    ARRAY[7, 1, 15, 13, 5, 17, 9, 3, 11,  12, 18, 6, 2, 8, 16, 14, 4, 10]
);

-- 5. San Andrés Golf Club (Par 72)
-- Campo clásico, muchos árboles.
SELECT seed_course_holes(
    'san-andres', 
    'Campo Principal',
    ARRAY[4, 5, 4, 3, 4, 5, 3, 4, 4,  4, 4, 3, 5, 4, 4, 3, 5, 4], 
    ARRAY[3, 13, 1, 15, 7, 11, 17, 9, 5,  4, 2, 16, 12, 8, 10, 18, 14, 6]
);

-- 6. Club Guaymaral - Campo 1 (Par 72)
SELECT seed_course_holes(
    'guaymaral-1', 
    'Campo 1',
    ARRAY[4, 4, 5, 3, 4, 4, 3, 5, 4,  4, 5, 3, 4, 4, 3, 4, 5, 4], 
    ARRAY[5, 11, 13, 17, 1, 9, 15, 7, 3,  6, 12, 18, 2, 10, 16, 8, 14, 4]
);

-- 7. Briceño 18 (Par 72)
-- Campo abierto, viento influyente.
SELECT seed_course_holes(
    'briceno-18', 
    'Campo Principal',
    ARRAY[5, 4, 3, 4, 4, 5, 3, 4, 4,  4, 4, 3, 5, 4, 5, 3, 4, 4], 
    ARRAY[13, 1, 17, 7, 9, 11, 15, 5, 3,  4, 2, 16, 12, 6, 14, 18, 8, 10]
);

-- Drop the helper function to clean up
DROP FUNCTION seed_course_holes;
