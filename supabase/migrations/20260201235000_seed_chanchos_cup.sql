DO $$
DECLARE
    -- ID del Torneo
    t_id UUID := '4b6b9dcd-2f53-4391-a479-2a4e39a1bb99';
    
    -- Variables para IDs de jugadores
    p_heitan UUID;
    p_gabriel UUID;
    p_suomi UUID;
    p_mandarina UUID;
    p_naito UUID;
    p_kaiser UUID;
    p_mawlock UUID;
    p_nego UUID;
    p_trolltuga UUID;
    p_ale_torres UUID;
    
    -- Helper para contar partidos
    p_match_count INT := 0;
BEGIN
    -- 1. Buscar IDs de jugadores (Intentamos coincidencia flexible)
    SELECT id INTO p_heitan FROM profiles WHERE username ILIKE '%Heitan%' LIMIT 1;
    SELECT id INTO p_gabriel FROM profiles WHERE username ILIKE '%Gabriel%' LIMIT 1;
    SELECT id INTO p_suomi FROM profiles WHERE username ILIKE '%Suomi%' LIMIT 1;
    SELECT id INTO p_mandarina FROM profiles WHERE username ILIKE '%Mandarina%' LIMIT 1;
    SELECT id INTO p_naito FROM profiles WHERE username ILIKE '%Naito%' LIMIT 1;
    SELECT id INTO p_kaiser FROM profiles WHERE username ILIKE '%Kaiser%' LIMIT 1;
    SELECT id INTO p_mawlock FROM profiles WHERE username ILIKE '%Mawlock%' LIMIT 1;
    SELECT id INTO p_nego FROM profiles WHERE username ILIKE '%Nego%' LIMIT 1;
    SELECT id INTO p_trolltuga FROM profiles WHERE username ILIKE '%Trolltuga%' LIMIT 1;
    SELECT id INTO p_ale_torres FROM profiles WHERE username ILIKE '%Ale Torres%' OR username ILIKE '%AleTorres%' LIMIT 1;

    -- Verificar si encontramos al menos algunos (log opcional)
    -- RAISE NOTICE 'Heitan ID: %', p_heitan;

    -- 2. Limpiar partidos existentes para este torneo para evitar duplicados
    DELETE FROM matches WHERE tournament_id = t_id;

    -- 3. Insertar Partidos
    -- Función auxiliar local para insertar (simulada con repetición de código para compatibilidad SQL pura dentro de DO block)

    -- JORNADA 1
    -- Heitan vs Gabriel (0-2) -> Ganador Gabriel
    IF p_heitan IS NOT NULL AND p_gabriel IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 1, p_heitan, p_gabriel, p_gabriel, '0-2', 'completed', 1);
    END IF;

    -- Suomi vs Mandarina (0-2) -> Ganador Mandarina
    IF p_suomi IS NOT NULL AND p_mandarina IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 1, p_suomi, p_mandarina, p_mandarina, '0-2', 'completed', 2);
    END IF;
    
    -- Naito vs Kaiser (2-0) -> Ganador Naito
    IF p_naito IS NOT NULL AND p_kaiser IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 1, p_naito, p_kaiser, p_naito, '2-0', 'completed', 3);
    END IF;

    -- Mawlock vs Nego (1-1) -> Empate (NULL winner)
    IF p_mawlock IS NOT NULL AND p_nego IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 1, p_mawlock, p_nego, NULL, '1-1', 'completed', 4);
    END IF;

    -- Trolltuga vs Ale Torres (2-0) -> Ganador Trolltuga
    IF p_trolltuga IS NOT NULL AND p_ale_torres IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 1, p_trolltuga, p_ale_torres, p_trolltuga, '2-0', 'completed', 5);
    END IF;


    -- JORNADA 2
    -- Heitan vs Mandarina (0-2) -> Ganador Mandarina
    IF p_heitan IS NOT NULL AND p_mandarina IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 2, p_heitan, p_mandarina, p_mandarina, '0-2', 'completed', 6);
    END IF;

    -- Gabriel vs Kaiser (Pendiente)
    IF p_gabriel IS NOT NULL AND p_kaiser IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 2, p_gabriel, p_kaiser, NULL, NULL, 'scheduled', 7);
    END IF;

    -- Suomi vs Nego (Pendiente)
    IF p_suomi IS NOT NULL AND p_nego IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 2, p_suomi, p_nego, NULL, NULL, 'scheduled', 8);
    END IF;

    -- Naito vs Ale Torres (Pendiente)
    IF p_naito IS NOT NULL AND p_ale_torres IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 2, p_naito, p_ale_torres, NULL, NULL, 'scheduled', 9);
    END IF;

    -- Mawlock vs Trolltuga (1-1) -> Empate
    IF p_mawlock IS NOT NULL AND p_trolltuga IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 2, p_mawlock, p_trolltuga, NULL, '1-1', 'completed', 10);
    END IF;


    -- JORNADA 3
    -- Heitan vs Kaiser (Pendiente)
    IF p_heitan IS NOT NULL AND p_kaiser IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 3, p_heitan, p_kaiser, NULL, NULL, 'scheduled', 11);
    END IF;

    -- Mandarina vs Nego (2-0) -> Gana Mandarina
    IF p_mandarina IS NOT NULL AND p_nego IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 3, p_mandarina, p_nego, p_mandarina, '2-0', 'completed', 12);
    END IF;

    -- Gabriel vs Ale Torres (2-0) -> Gana Gabriel
    IF p_gabriel IS NOT NULL AND p_ale_torres IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 3, p_gabriel, p_ale_torres, p_gabriel, '2-0', 'completed', 13);
    END IF;

    -- Suomi vs Trolltuga (1-1) -> Empate (Aunque dice Suomi 1 y Trolltuga 1, asumimos empate si ganaron uno cada uno)
    IF p_suomi IS NOT NULL AND p_trolltuga IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 3, p_suomi, p_trolltuga, NULL, '1-1', 'completed', 14);
    END IF;

    -- Naito vs Mawlock (Pendiente)
    IF p_naito IS NOT NULL AND p_mawlock IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 3, p_naito, p_mawlock, NULL, NULL, 'scheduled', 15);
    END IF;


    -- JORNADA 4
    -- Heitan vs Nego (2-0) -> Gana Heitan (Según hoja dice Heitan,Heitan)
    IF p_heitan IS NOT NULL AND p_nego IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 4, p_heitan, p_nego, p_heitan, '2-0', 'completed', 16);
    END IF;

    -- Kaiser vs Ale Torres (Pendiente)
    IF p_kaiser IS NOT NULL AND p_ale_torres IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 4, p_kaiser, p_ale_torres, NULL, NULL, 'scheduled', 17);
    END IF;

    -- Mandarina vs Trolltuga (2-0) -> Gana Mandarina
    IF p_mandarina IS NOT NULL AND p_trolltuga IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 4, p_mandarina, p_trolltuga, p_mandarina, '2-0', 'completed', 18);
    END IF;

    -- Gabriel vs Mawlock (2-0) -> Gana Gabriel
    IF p_gabriel IS NOT NULL AND p_mawlock IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 4, p_gabriel, p_mawlock, p_gabriel, '2-0', 'completed', 19);
    END IF;

    -- Suomi vs Naito (Pendiente)
    IF p_suomi IS NOT NULL AND p_naito IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 4, p_suomi, p_naito, NULL, NULL, 'scheduled', 20);
    END IF;

    
    -- JORNADA 5
    -- Heitan vs Ale Torres (2-0) -> Gana Heitan
    IF p_heitan IS NOT NULL AND p_ale_torres IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 5, p_heitan, p_ale_torres, p_heitan, '2-0', 'completed', 21);
    END IF;

    -- Nego vs Trolltuga (0-2) -> Gana Trolltuga
    IF p_nego IS NOT NULL AND p_trolltuga IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 5, p_nego, p_trolltuga, p_trolltuga, '0-2', 'completed', 22);
    END IF;

    -- Kaiser vs Mawlock (1-0?) -> Solo dice "Kaiser" en Juego 1 y nada en Juego 2. Asumimos 1-0 parcial o 2-0?
    -- Si falta el segundo juego, dejamos 1-0. O si es error de entrada, pendiente.
    -- Asumiré que ganó Kaiser el primero y está incompleto, o pondré 1-0. Pondré 1-0 como completed si eso significa victoria. 
    -- Si es al mejor de 2, y solo jugaron uno, es scheduled?
    -- Ante la duda: "1-0" completed.
    IF p_kaiser IS NOT NULL AND p_mawlock IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 5, p_kaiser, p_mawlock, p_kaiser, '1-0', 'completed', 23);
    END IF;

    -- Mandarina vs Naito (1-1) -> Empate (Mandarina gana 1, Naito gana 2)
    IF p_mandarina IS NOT NULL AND p_naito IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 5, p_mandarina, p_naito, NULL, '1-1', 'completed', 24);
    END IF;

    -- Gabriel vs Suomi (2-0) -> Gana Gabriel
    IF p_gabriel IS NOT NULL AND p_suomi IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 5, p_gabriel, p_suomi, p_gabriel, '2-0', 'completed', 25);
    END IF;


    -- JORNADA 6
    -- Heitan vs Trolltuga (Pendiente)
    IF p_heitan IS NOT NULL AND p_trolltuga IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 6, p_heitan, p_trolltuga, NULL, NULL, 'scheduled', 26);
    END IF;

    -- Ale Torres vs Mawlock (0-2) -> Gana Mawlock
    IF p_ale_torres IS NOT NULL AND p_mawlock IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 6, p_ale_torres, p_mawlock, p_mawlock, '0-2', 'completed', 27);
    END IF;

    -- Nego vs Naito (Pendiente)
    IF p_nego IS NOT NULL AND p_naito IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 6, p_nego, p_naito, NULL, NULL, 'scheduled', 28);
    END IF;

    -- Kaiser vs Suomi (Pendiente)
    IF p_kaiser IS NOT NULL AND p_suomi IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 6, p_kaiser, p_suomi, NULL, NULL, 'scheduled', 29);
    END IF;

    -- Mandarina vs Gabriel (1-1) -> Empate
    IF p_mandarina IS NOT NULL AND p_gabriel IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 6, p_mandarina, p_gabriel, NULL, '1-1', 'completed', 30);
    END IF;


    -- JORNADA 7
    -- Heitan vs Mawlock (Pendiente)
    IF p_heitan IS NOT NULL AND p_mawlock IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 7, p_heitan, p_mawlock, NULL, NULL, 'scheduled', 31);
    END IF;

    -- Trolltuga vs Naito (2-0) -> Gana Trolltuga
    IF p_trolltuga IS NOT NULL AND p_naito IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 7, p_trolltuga, p_naito, p_trolltuga, '2-0', 'completed', 32);
    END IF;

    -- Ale Torres vs Suomi (0-2) -> Gana Suomi (dice "Ganador Juego 1: Suomi", "Ganador Juego 2: Suomi")
    IF p_ale_torres IS NOT NULL AND p_suomi IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 7, p_ale_torres, p_suomi, p_suomi, '0-2', 'completed', 33);
    END IF;

    -- Nego vs Gabriel (Pendiente)
    IF p_nego IS NOT NULL AND p_gabriel IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 7, p_nego, p_gabriel, NULL, NULL, 'scheduled', 34);
    END IF;

    -- Kaiser vs Mandarina (1-1) -> Empate (?)
    -- CSV dice: "Kaiser, Mandarina, Kaiser, Mandarina".
    -- Ganador J1: Kaiser. Ganador J2: Mandarina. -> 1-1 Empate.
    IF p_kaiser IS NOT NULL AND p_mandarina IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 7, p_kaiser, p_mandarina, NULL, '1-1', 'completed', 35);
    END IF;


    -- JORNADA 8
    -- Heitan vs Naito (1-1) -> Empate (Heitan, Naito)
    IF p_heitan IS NOT NULL AND p_naito IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 8, p_heitan, p_naito, NULL, '1-1', 'completed', 36);
    END IF;

    -- Mawlock vs Suomi (Pendiente)
    IF p_mawlock IS NOT NULL AND p_suomi IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 8, p_mawlock, p_suomi, NULL, NULL, 'scheduled', 37);
    END IF;

    -- Trolltuga vs Gabriel (2-0) -> Gana Trolltuga
    IF p_trolltuga IS NOT NULL AND p_gabriel IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 8, p_trolltuga, p_gabriel, p_trolltuga, '2-0', 'completed', 38);
    END IF;

    -- Ale Torres vs Mandarina (0-2) -> Gana Mandarina
    IF p_ale_torres IS NOT NULL AND p_mandarina IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 8, p_ale_torres, p_mandarina, p_mandarina, '0-2', 'completed', 39);
    END IF;

    -- Nego vs Kaiser (0-2) -> Gana Kaiser (dice "nego"?? NO PERDÓN)
    -- CSV dice: "Nego, Kaiser, nego, nego". -> Gana Nego J1 y J2.
    -- Resultado: 2-0 Gana NEGO.
    IF p_nego IS NOT NULL AND p_kaiser IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 8, p_nego, p_kaiser, p_nego, '2-0', 'completed', 40);
    END IF;


    -- JORNADA 9
    -- Heitan vs Suomi (Pendiente)
    IF p_heitan IS NOT NULL AND p_suomi IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 9, p_heitan, p_suomi, NULL, NULL, 'scheduled', 41);
    END IF;

    -- Naito vs Gabriel (0-1?) -> CSV: "Naito, Gabriel, Gabriel," (J2 vacio).
    -- ¿Ganó Gabriel J1 y falta J2?
    -- Lo marcaré como 'completed' 0-1 a favor de Gabriel o 'scheduled' con resultado parcial.
    -- Asumiré Completado 0-1.
    IF p_naito IS NOT NULL AND p_gabriel IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 9, p_naito, p_gabriel, p_gabriel, '0-1', 'completed', 42);
    END IF;

    -- Mawlock vs Mandarina (Pendiente)
    IF p_mawlock IS NOT NULL AND p_mandarina IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 9, p_mawlock, p_mandarina, NULL, NULL, 'scheduled', 43);
    END IF;

    -- Trolltuga vs Kaiser (Pendiente)
    IF p_trolltuga IS NOT NULL AND p_kaiser IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 9, p_trolltuga, p_kaiser, NULL, NULL, 'scheduled', 44);
    END IF;

    -- Ale Torres vs Nego (1-1) -> Empate
    -- CSV: "Ale Torres, Nego, nego, ale torres". (J1 Nego, J2 Ale Torres) -> 1-1.
    IF p_ale_torres IS NOT NULL AND p_nego IS NOT NULL THEN
        INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, result_score, status, match_number)
        VALUES (t_id, 9, p_ale_torres, p_nego, NULL, '1-1', 'completed', 45);
    END IF;

END $$;
