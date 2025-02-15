// src/content/debug.ts
interface BuilderScoreDebug {
    log: (...args: any[]) => void;
    error: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    enable: () => void;
    disable: () => void;
}

interface BuilderScoreUtils {
    checkSelectors: (username: string) => void;
    reinject: (username?: string) => Promise<void>;
    forceInit: () => void;
}

interface BuilderScore {
    debug: BuilderScoreDebug;
    utils: BuilderScoreUtils;
}

declare global {
    interface Window {
        BuilderScore: BuilderScore;
    }
}

// Criar objeto global para debug
const initializeDebug = () => {
    console.log('[BuilderScore] Initializing debug utilities...');

    if (!window.BuilderScore) {
        window.BuilderScore = {} as BuilderScore;
    }

    let DEBUG = true;

    window.BuilderScore.debug = {
        log: (...args: any[]) => {
            if (DEBUG) {
                console.log('%c[BuilderScore]', 'background: #8a2be2; color: white; padding: 2px 5px; border-radius: 3px;', ...args);
            }
        },
        error: (...args: any[]) => {
            if (DEBUG) {
                console.error('%c[BuilderScore Error]', 'background: #ff0000; color: white; padding: 2px 5px; border-radius: 3px;', ...args);
            }
        },
        warn: (...args: any[]) => {
            if (DEBUG) {
                console.warn('%c[BuilderScore Warning]', 'background: #ffa500; color: white; padding: 2px 5px; border-radius: 3px;', ...args);
            }
        },
        enable: () => {
            DEBUG = true;
            window.BuilderScore.debug.log('Debugging enabled');
        },
        disable: () => {
            DEBUG = false;
            console.log('[BuilderScore] Debugging disabled');
        }
    };

    // Log inicial para confirmar que foi carregado
    window.BuilderScore.debug.log('Debug utilities initialized');
};

// Auto-inicializar
initializeDebug();

export { initializeDebug };