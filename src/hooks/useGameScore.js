import { useState } from 'react';

/**
 * Vlastní React hook pro správu skóre ve hře. Udržuje celkové skóre hráče, počet pokusů a použití nápovědy pro aktuální scénu.
 * Poskytuje funkce pro zaznamenávání chyb, použití nápovědy, načítání skóre, odevzdávání výsledků scény a resetování skóre.
 * @returns {Object} - Objekt obsahující aktuální skóre, počet pokusů, indikátor použití nápovědy a funkce pro správu skóre.
 */
export const useGameScore = () => {
    const [totalScore, setTotalScore] = useState(0);
    const [sceneAttempts, setSceneAttempts] = useState(0);
    const [usedHint, setUsedHint] = useState(false);
    const [sawAns, setSawAns] = useState(false);
    const BASE_SCORE = 100;
    const MISTAKE_PENALTY = 10;
    const HINT_PENALTY = 25;
    const MIN_SCORE_PER_SCENE = 10;

    /**
     * Zaznamená chybu hráče v aktuální scéně.
     */
    const registerMistake = () => {
        setSceneAttempts((prev) => prev + 1);
    };

    /**
     * Zaznamená použití nápovědy hráčem v aktuální scéně.
     */
    const registerHint = () => {
        setUsedHint(true);
        if(sceneAttempts > 10){
            setSawAns(true);
        }
    };

    /**
     * Načte celkové skóre hráče.
     * @param {*} newScore - Nové skóre, které se načte jako aktuální celkové skóre.
     */

    const loadScore = (newScore) => {
        setTotalScore(newScore);
    };

    /**
     * Odevzdá výsledky aktuální scény a aktualizuje celkové skóre.
     * @returns {number} - Počet bodů získaných za aktuální scénu, který se přičte k celkovému skóre.
     */
    const submitScene = () => {
        let earnedPoints = BASE_SCORE;

        earnedPoints -= sceneAttempts * MISTAKE_PENALTY;

        if (usedHint) {
            earnedPoints -= HINT_PENALTY;
        }

        if (earnedPoints < MIN_SCORE_PER_SCENE) {
            earnedPoints = MIN_SCORE_PER_SCENE;
        }

        if(sawAns){
            earnedPoints = 0;
        }

        setTotalScore((prev) => prev + earnedPoints);

        setSceneAttempts(0);
        setUsedHint(false);
        return earnedPoints;
    };

    /**
     * Resetuje skóre a stav pokusů pro aktuální scénu.
     */
    const resetScore = () => {
        setTotalScore(0);
        setSceneAttempts(0);
        setUsedHint(false);
    };

    return {
        score: totalScore,
        sceneAttempts,
        usedHint,
        registerMistake,
        registerHint,
        loadScore,
        submitScene,
        resetScore,
    };
};
