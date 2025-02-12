import React, { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { PassportData } from '../types';
import Leaderboard from '../components/Leaderboard'

const API_KEY = process.env.TALENT_PROTOCOL_API_KEY!;

// Constantes reutilizáveis
const ERROR_MESSAGES = {
    NO_API_KEY: 'API key não configurada',
    NO_TAB_URL: 'Nenhuma URL de aba ativa encontrada',
    NO_USERNAME: 'Nenhum nome de usuário do Twitter encontrado na URL',
    API_FAILURE: 'Falha na requisição da API:',
    FETCH_ERROR: 'Erro ao buscar dados do passaporte:'
};

const URL_PATTERNS = {
    TWITTER_USERNAME: /(twitter\.com|x\.com)\/([^/]+)/,
    TALENT_PROFILE: (id: string) => `https://app.talentprotocol.com/profile/${id}`
};


const ScoreRow: React.FC<{ label: string; value: number }> = ({ label, value }) => (
    <div className="flex justify-between">
        <span>{label}</span>
        <span>{value}</span>
    </div>
);


const PopupHeader: React.FC = () => (
    <div className="text-xl font-bold mb-4">Builder Score</div>
);


const ProfileLink: React.FC<{ passportId: string }> = ({ passportId }) => (
    <a
        href={URL_PATTERNS.TALENT_PROFILE(passportId)}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
    >
        View on Talent Protocol
    </a>
);


const usePassportData = () => {
    const { getPassportData, setPassportData } = useStore();
    const [state, setState] = useState<{
        loading: boolean;
        error: string | null;
        username: string | null;
        passport: PassportData | null;
    }>({
        loading: true,
        error: null,
        username: null,
        passport: null
    });

    const fetchData = async () => {
        try {
            console.log('[Popup] Iniciando busca de dados...');

            if (!API_KEY) {
                console.error('[Popup] Erro: API key não configurada');
                setState(prev => ({ ...prev, error: ERROR_MESSAGES.NO_API_KEY, loading: false }));
                return;
            }

            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            console.log('[Popup] Abas encontradas:', tabs);

            const url = tabs[0]?.url;
            if (!url) {
                console.warn('[Popup] Nenhuma URL encontrada na aba ativa');
                setState(prev => ({ ...prev, error: ERROR_MESSAGES.NO_TAB_URL, loading: false }));
                return;
            }

            const match = url.match(URL_PATTERNS.TWITTER_USERNAME);
            const username = match?.[1];
            console.log('[Popup] Username extraído:', username);

            if (!username) {
                console.warn('[Popup] Nenhum username encontrado na URL');
                setState(prev => ({ ...prev, error: ERROR_MESSAGES.NO_USERNAME, loading: false }));
                return;
            }

            setState(prev => ({ ...prev, username }));

            const cachedData = getPassportData(username);
            if (cachedData) {
                console.log('[Popup] Usando dados em cache para:', username);
                setState(prev => ({
                    ...prev,
                    loading: false,
                    passport: cachedData.passport
                }));
                return;
            }

            console.log('[Popup] Buscando dados da API para:', username);
            const response = await fetch(
                `https://api.talentprotocol.com/api/v2/passports?filter[twitter]=${username}`,
                {
                    headers: {
                        'X-API-KEY': API_KEY,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('[Popup] Resposta da API:', response.status);
            if (!response.ok) {
                throw new Error(`${ERROR_MESSAGES.API_FAILURE} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('[Popup] Dados recebidos:', data);
            const passportData = data.passports[0];

            if (passportData) {
                console.log('[Popup] Salvando dados no cache:', username);
                setPassportData(username, { passport: passportData });
                setState(prev => ({
                    ...prev,
                    loading: false,
                    passport: passportData
                }));
            } else {
                console.warn('[Popup] Nenhum dado de passaporte encontrado');
                setState(prev => ({ ...prev, loading: false }));
            }
        } catch (err) {
            console.error('[Popup] Erro durante o fetch:', err);
            setState(prev => ({
                ...prev,
                error: err instanceof Error ? err.message : ERROR_MESSAGES.FETCH_ERROR,
                loading: false
            }));
        }
    };

    return { ...state, fetchData };
};

export const Popup: React.FC = () => {
    const { loading, error, username, passport, fetchData } = usePassportData();

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return <div className="p-4">Carregando dados do passaporte...</div>;
    }

    if (error) {
        return <div className="p-4 text-red-600">Erro: {error}</div>;
    }

    if (!username) {
        return <div className="p-4">Perfil do Twitter não detectado</div>;
    }

    if (!passport) {
        return <div className="p-4">Nenhum dado de passaporte encontrado para @{username}</div>;
    }

    return (
        <div className="p-4 w-80">
            <PopupHeader />
            <div className="space-y-4">
                <Leaderboard />
                <div className="flex items-center justify-between bg-purple-100 p-3 rounded-lg">
                    <span>@{username}</span>
                    <span className="font-bold text-lg">{passport.score}</span>
                </div>

                <div className="space-y-2">
                    <ScoreRow label="Activity Score" value={passport.activity_score} />
                    <ScoreRow label="Identity Score" value={passport.identity_score} />
                    <ScoreRow label="Skills Score" value={passport.skills_score} />
                </div>

                <ProfileLink passportId={passport.passport_id} />
            </div>
        </div>
    );
};