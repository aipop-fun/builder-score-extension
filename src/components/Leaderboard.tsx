import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface LeaderboardUser {
    passport_id: string
    display_name: string
    profile_name: string
    image_url: string
    score: number
    activity_score: number
    identity_score: number
    skills_score: number
    rank: number
}

const Leaderboard = () => {
    const [users, setUsers] = useState<LeaderboardUser[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchLeaderboard = async () => {
        try {
            console.log('[Leaderboard] Buscando dados do Supabase...')

            const { data, error } = await supabase
                .from('passport_records')
                .select(`
          passport_id,
          display_name,
          profile_name,
          image_url,
          score,
          activity_score,
          identity_score,
          skills_score
        `)
                .order('score', { ascending: false })
                .limit(20)

            if (error) throw error
            if (!data) throw new Error('Nenhum dado encontrado')

            console.log('[Leaderboard] Dados recebidos:', data)

            const rankedUsers = data.map((user, index) => ({
                ...user,
                rank: index + 1
            }))

            setUsers(rankedUsers)
        } catch (err) {
            console.error('[Leaderboard] Erro:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // Primeira carga
        fetchLeaderboard()

        // Configurar atualizações em tempo real
        const channel = supabase
            .channel('realtime-passports')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'passport_records'
                },
                () => {
                    console.log('[WebSocket] Mudança detectada, atualizando...')
                    fetchLeaderboard()
                }
            )
            .subscribe()

        // Cleanup
        return () => {
            console.log('[WebSocket] Desinscrevendo...')
            supabase.removeChannel(channel)
        }
    }, [])

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                Carregando leaderboard...
            </div>
        )
    }

    if (error) {
        return (
            <div className="error">
                Erro ao carregar leaderboard: {error}
            </div>
        )
    }

    return (
        <div className="leaderboard">
            <div className="header">
                <h2>🏆 Builder Leaderboard</h2>
                <small>Atualizado em tempo real</small>
            </div>

            <div className="user-list">
                {users.map(user => (
                    <div key={user.passport_id} className="user-card">
                        <div className="rank">{user.rank}</div>
                        <img
                            src={user.image_url}
                            alt={user.display_name}
                            className="avatar"
                        />
                        <div className="user-info">
                            <div className="name">{user.display_name}</div>
                            <div className="username">@{user.profile_name}</div>
                            <div className="scores">
                                <div className="score-item">
                                    <span>🏅 Total</span>
                                    <strong>{user.score}</strong>
                                </div>
                                <div className="score-item">
                                    <span>⚡ Atividade</span>
                                    <strong>{user.activity_score}</strong>
                                </div>
                                <div className="score-item">
                                    <span>🆔 Identidade</span>
                                    <strong>{user.identity_score}</strong>
                                </div>
                                <div className="score-item">
                                    <span>🎯 Habilidades</span>
                                    <strong>{user.skills_score}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Leaderboard