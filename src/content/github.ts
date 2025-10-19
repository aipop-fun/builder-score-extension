import React from 'react';
import { createRoot } from 'react-dom/client';
import { TipModal } from '@/components/TipModal';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/config/reown';

// Criar QueryClient para React Query
const queryClient = new QueryClient();

interface GitHubProfileData {
    username: string;
    walletAddress?: string;
    passportData?: {
        displayName: string;
        imageUrl: string;
        score: number;
    };
}

class GitHubTipIntegration {
    private logger: Console;
    private processedProfiles: Set<string>;
    private observer: MutationObserver | null;

    constructor() {
        this.logger = console;
        this.processedProfiles = new Set();
        this.observer = null;
        this.logger.log('[GitHub] Tip integration initialized');
    }

    private async getPassportData(username: string): Promise<GitHubProfileData> {
        try {
            // Buscar dados do Talent Protocol
            const response = await fetch(
                `https://talent.aipop.fun/api/passport/${username}`
            );

            if (!response.ok) {
                return { username };
            }

            const data = await response.json();

            if (data.success && data.data) {
                return {
                    username,
                    walletAddress: data.data.main_wallet,
                    passportData: {
                        displayName: data.data.displayName,
                        imageUrl: data.data.imageUrl,
                        score: data.data.score
                    }
                };
            }

            return { username };
        } catch (error) {
            this.logger.error('[GitHub] Error fetching passport data:', error);
            return { username };
        }
    }

    private createTipButton(profileData: GitHubProfileData): HTMLElement {
        const button = document.createElement('button');
        button.className = 'btn btn-sm tip-builder-button';
        button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 6px;">
        <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14.5c-3.58 0-6.5-2.92-6.5-6.5S4.42 1.5 8 1.5s6.5 2.92 6.5 6.5-2.92 6.5-6.5 6.5z"/>
        <path d="M8 4c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1s1-.45 1-1V5c0-.55-.45-1-1-1zm0 6c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
      </svg>
      Tip Builder
    `;

        // Estilo do botão
        Object.assign(button.style, {
            display: 'inline-flex',
            alignItems: 'center',
            padding: '6px 16px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginLeft: '8px'
        });

        // Hover effect
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = '#7c3aed';
            button.style.transform = 'translateY(-1px)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = '#8b5cf6';
            button.style.transform = 'translateY(0)';
        });

        // Click handler
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.openTipModal(profileData);
        });

        return button;
    }

    private openTipModal(profileData: GitHubProfileData): void {
        // Criar container para o modal
        const modalContainer = document.createElement('div');
        modalContainer.id = 'tip-modal-root';
        document.body.appendChild(modalContainer);

        // Criar root do React
        const root = createRoot(modalContainer);

        // Função para fechar o modal
        const handleClose = () => {
            root.unmount();
            modalContainer.remove();
        };

        // Renderizar modal com providers necessários
        root.render(
            React.createElement(
                WagmiProvider,
                { config },
                React.createElement(
                    QueryClientProvider,
                    { client: queryClient },
                    React.createElement(TipModal, {
                        githubUsername: profileData.username,
                        walletAddress: profileData.walletAddress,
                        passportData: profileData.passportData,
                        onClose: handleClose
                    })
                )
            )
        );
    }

    private async injectTipButton(): Promise<void> {
        // Detectar página de perfil do GitHub
        const isProfilePage = /^\/[^\/]+\/?$/.test(window.location.pathname);

        if (!isProfilePage) return;

        // Extrair username da URL
        const username = window.location.pathname.split('/')[1];

        if (!username || this.processedProfiles.has(username)) return;

        // Buscar container de ações do perfil
        const actionsContainer = document.querySelector('.js-profile-editable-area') ||
            document.querySelector('[data-hovercard-type="user"]')?.closest('.d-flex');

        if (!actionsContainer) {
            this.logger.log('[GitHub] Profile actions container not found');
            return;
        }

        // Buscar dados do perfil
        const profileData = await this.getPassportData(username);

        // Criar e injetar botão
        const tipButton = this.createTipButton(profileData);
        actionsContainer.appendChild(tipButton);

        this.processedProfiles.add(username);
        this.logger.log('[GitHub] Tip button injected for:', username);

        // Adicionar badge de score se disponível
        if (profileData.passportData) {
            this.injectScoreBadge(profileData.passportData);
        }
    }

    private injectScoreBadge(passportData: NonNullable<GitHubProfileData['passportData']>): void {
        const profileName = document.querySelector('.vcard-fullname');

        if (!profileName || profileName.querySelector('.builder-score-badge')) return;

        const badge = document.createElement('span');
        badge.className = 'builder-score-badge';
        badge.textContent = `${passportData.score}`;
        badge.title = `Builder Score: ${passportData.score}`;

        Object.assign(badge.style, {
            display: 'inline-flex',
            alignItems: 'center',
            marginLeft: '8px',
            padding: '2px 8px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600'
        });

        profileName.appendChild(badge);
    }

    private observePageChanges(): void {
        this.observer = new MutationObserver(() => {
            this.injectTipButton();
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    public init(): void {
        // Injetar na página inicial
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.injectTipButton();
                this.observePageChanges();
            });
        } else {
            this.injectTipButton();
            this.observePageChanges();
        }

        // Observar mudanças de rota (GitHub usa turbolinks)
        window.addEventListener('popstate', () => {
            this.processedProfiles.clear();
            setTimeout(() => this.injectTipButton(), 500);
        });
    }

    public destroy(): void {
        if (this.observer) {
            this.observer.disconnect();
        }
        document.querySelectorAll('.tip-builder-button').forEach(btn => btn.remove());
        document.querySelectorAll('#tip-modal-root').forEach(modal => modal.remove());
    }
}

// Inicializar integração
const githubTipIntegration = new GitHubTipIntegration();
githubTipIntegration.init();

// Cleanup
window.addEventListener('unload', () => githubTipIntegration.destroy());