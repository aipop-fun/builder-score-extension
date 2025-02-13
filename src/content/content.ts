import PopupComponent from "@/components/PopupComponent";

// Types and Interfaces

enum PlatformType {
    TWITTER = 'twitter',
    GITHUB = 'github',
    FARCASTER = 'farcaster',
    ENS = 'ens',
    LENS = 'lens'
}

interface IdentityQuery {
    provider: string;
    username: string;
}

interface PassportData {
    passport_id: string;
    activity_score: number;
    calculating_score: boolean;
    created_at: string;
    human_checkmark: boolean;
    identity_score: number;
    last_calculated_at: string;
    main_wallet: string;
    main_wallet_changed_at: string;
    onchain: boolean;
    score: number;
    skills_score: number;
    socials_calculated_at: string;
    verified: boolean;
}

interface BuilderScoreData {
    score: number;
    verified: boolean;
    displayName: string;
    bio: string;
    imageUrl: string;
    socialProfiles: {
        github?: Social;
        twitter?: Social;
        farcaster?: Social;
    };
    skills: {
        activity: number;
        identity: number;
        skills: number;
    };
    lastUpdated: string;
}

interface BuilderScoreResponse {
    success: boolean;
    data?: {
        score: number;
        verified: boolean;
    };
    error?: string;
}

// Configuration
const CONFIG = {
    DEBUG: true,
    MUTATION_DEBOUNCE: 500,
    BADGE_UPDATE_COOLDOWN: 2000,
    SELECTORS: {
        TWITTER: {
            PROFILE_NAME: 'div[data-testid="UserName"], h2[role="heading"], div[data-testid="UserCell"]',
            DISPLAY_NAME: 'div[dir="ltr"]'
        },
        WARPCAST: {            
            PROFILE_CONTAINER: '.min-w-0.flex-auto.space-y-3',            
            USERNAME_CONTAINER: '.flex.flex-row.items-center.justify-between',            
            USERNAME: '.text-base.text-faint',            
            BADGE_CONTAINER: '.flex.flex-row.items-center.space-x-2',            
            STATS_CONTAINER: '.flex.w-full.flex-row.flex-wrap.gap-2'
        }
    },
    PLATFORMS: {
        TWITTER: 'twitter',
        WARPCAST: 'warpcast'
    }
} as const;

// Logger Service
class Logger {
    private readonly debug: boolean;

    constructor(debug: boolean) {
        this.debug = debug;
    }

    log(...args: any[]): void {
        if (this.debug) {
            console.log('%c[BuilderScore]', 'color: #8b5cf6;', ...args);
        }
    }

    error(...args: any[]): void {
        console.error('%c[BuilderScore]', 'color: #ef4444;', ...args);
    }
}

// Platform Service
export class PlatformService {
    getCurrentPlatform(): string {
        return window.location.hostname.includes('warpcast.com')
            ? CONFIG.PLATFORMS.WARPCAST
            : CONFIG.PLATFORMS.TWITTER;
    }

    getUsername(platform: string, isTestMode: boolean): string | null {
        if (isTestMode) return 'testUser';

        if (platform === CONFIG.PLATFORMS.WARPCAST) {            
            const path = window.location.pathname;
            const urlUsername = path.split('/').filter(p => p)[0]; 
            if (urlUsername && !['home', 'explore', 'notifications', 'user'].includes(urlUsername)) {
                return urlUsername;
            }

            
            const usernameElement = document.querySelector(CONFIG.SELECTORS.WARPCAST.USERNAME);
            if (usernameElement) {
                const username = usernameElement.textContent?.trim();
                return username?.startsWith('@') ? username.substring(1) : username;
            }
            return null;
        } else {
            
            const path = window.location.pathname;
            if (!path) return null;

            const username = path.split('/')[1];
            if (!username || ['home', 'explore', 'notifications'].includes(username)) {
                return null;
            }
            return username;
        }
    }

    getTargetElement(element: Element, platform: string): Element | null {
        if (platform === CONFIG.PLATFORMS.WARPCAST) {            
            const badgeContainer = element.querySelector(CONFIG.SELECTORS.WARPCAST.BADGE_CONTAINER);
            if (badgeContainer) {
                return badgeContainer;
            }

            
            const statsContainer = element.querySelector(CONFIG.SELECTORS.WARPCAST.STATS_CONTAINER);
            if (statsContainer) {
                return statsContainer;
            }

            return null;
        } else {
            return element.querySelector(CONFIG.SELECTORS.TWITTER.DISPLAY_NAME);
        }
    }

    getSelector(platform: string): string {
        return platform === CONFIG.PLATFORMS.WARPCAST
            ? CONFIG.SELECTORS.WARPCAST.PROFILE_CONTAINER
            : CONFIG.SELECTORS.TWITTER.PROFILE_NAME;
    }
}

// Badge UI Service
class BadgeUIService {
    private lastBadgeUpdate: { [key: string]: number } = {};
    private popupInstance: PopupComponent | null = null;

    createBadge(
        data: BuilderScoreData,
        platform: string,
        username: string,
        onUpdate: () => Promise<void>
    ): HTMLElement {
        const badge = document.createElement('div');
        badge.className = 'builder-score-badge';

        // Aplicar estilos base
        this.applyBadgeStyles(badge, platform, data.verified);
        const scoreContainer = this.createScoreContainer(data.score, data.verified, platform);
        badge.appendChild(scoreContainer);

        // Definir título
        badge.title = `Builder Score: ${data.score}\n${data.verified ? 'Verified Account' : 'Not Verified'}`;

        // Adicionar event listener
        badge.addEventListener('click', async (event) => {
            event.stopPropagation();
            const now = Date.now();

            // Esconder popup existente
            if (this.popupInstance) {
                this.popupInstance.hide();
            }

            // Criar e mostrar novo popup
            this.popupInstance = new PopupComponent(data);
            this.popupInstance.show(badge);

            // Atualizar score se necessário
            if (now - (this.lastBadgeUpdate[username] || 0) >= CONFIG.BADGE_UPDATE_COOLDOWN) {
                this.lastBadgeUpdate[username] = now;
                badge.style.opacity = '0.8';

                try {
                    await onUpdate();
                } catch (error) {
                    console.error('Error updating score:', error);
                } finally {
                    badge.style.opacity = '1';
                }
            }
        });

        return badge;
    }

    private applyBadgeStyles(badge: HTMLElement, platform: string, verified: boolean): void {
        const gradientColor = verified
            ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
            : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)';

        const commonStyles = {
            background: gradientColor,
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(139, 92, 246, 0.2)'
        };

        if (platform === 'warpcast') {
            badge.className += ' flex w-max flex-row items-center space-x-1 rounded-full px-2 py-1 text-sm';
            Object.assign(badge.style, {
                ...commonStyles,
                margin: '0 4px'
            });
        } else {
            Object.assign(badge.style, {
                ...commonStyles,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '3px 10px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '600',
                marginLeft: '8px',
                verticalAlign: 'middle',
                minWidth: '44px',
                height: '24px'
            });
        }

        // Add hover effect
        badge.addEventListener('mouseenter', () => {
            badge.style.transform = 'translateY(-1px)';
            badge.style.boxShadow = '0 4px 6px rgba(139, 92, 246, 0.3)';
        });

        badge.addEventListener('mouseleave', () => {
            badge.style.transform = 'translateY(0)';
            badge.style.boxShadow = '0 2px 4px rgba(139, 92, 246, 0.2)';
        });
    }

    private createScoreContainer(score: number, verified: boolean, platform: string): HTMLElement {
        const container = document.createElement('div');
        container.className = platform === 'warpcast'
            ? 'flex items-center space-x-1'
            : 'flex items-center gap-1';

        const scoreText = document.createElement('span');
        const displayScore = Math.round(score);
        scoreText.textContent = platform === 'warpcast'
            ? `Score: ${displayScore}`
            : displayScore.toString();

        scoreText.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        container.appendChild(scoreText);

        if (verified) {
            container.appendChild(this.createVerifiedIcon(platform));
        }

        return container;
    }

    private createVerifiedIcon(platform: string): HTMLElement {
        if (platform === 'warpcast') {
            const icon = document.createElement('svg');
            icon.setAttribute('width', '14');
            icon.setAttribute('height', '14');
            icon.setAttribute('viewBox', '0 0 14 14');
            icon.setAttribute('fill', 'currentColor');
            icon.innerHTML = `
                <path d="M13.0303 3.96967C13.3232 4.26256 13.3232 4.73744 13.0303 5.03033L6.03033 12.0303C5.73744 12.3232 5.26256 12.3232 4.96967 12.0303L0.96967 8.03033C0.676777 7.73744 0.676777 7.26256 0.96967 6.96967C1.26256 6.67678 1.73744 6.67678 2.03033 6.96967L5.5 10.4393L11.9697 3.96967C12.2626 3.67678 12.7374 3.67678 13.0303 3.96967Z"/>
            `;
            return icon;
        } else {
            const icon = document.createElement('span');
            icon.textContent = '✓';
            icon.style.fontSize = '12px';
            return icon;
        }
    }

    private attachClickHandlers(
        badge: HTMLElement,
        data: typeof safeData,
        username: string,
        onUpdate: () => Promise<void>
    ): void {
        badge.onclick = async (event) => {
            event.stopPropagation();
            const now = Date.now();

            // Hide existing popup if it exists
            if (this.popupInstance) {
                this.popupInstance.hide();
            }

            // Create and show new popup
            this.popupInstance = new PopupComponent({
                score: data.score,
                verified: data.verified,
                skills: data.skills,
                socialProfiles: data.socialProfiles,
                displayName: data.displayName,
                imageUrl: data.imageUrl,
                bio: data.bio
            });

            this.popupInstance.show(badge);

            // Handle score update
            if (now - (this.lastBadgeUpdate[username] || 0) < CONFIG.BADGE_UPDATE_COOLDOWN) {
                return;
            }

            this.lastBadgeUpdate[username] = now;
            badge.style.opacity = '0.8';

            try {
                await onUpdate();
            } finally {
                badge.style.opacity = '1';
            }
        };
    }
}

// Main Builder Score Controller
class BuilderScoreController {
    private readonly logger: Logger;
    private readonly platformService: PlatformService;
    private readonly badgeUIService: BadgeUIService;
    private readonly processedElements: Set<Element>;
    private readonly observer: MutationObserver;
    private mutationTimeout: NodeJS.Timeout | null = null;
    private isTestMode = false;

    constructor() {
        this.logger = new Logger(CONFIG.DEBUG);
        this.platformService = new PlatformService();
        this.badgeUIService = new BadgeUIService();
        this.processedElements = new Set();
        this.observer = new MutationObserver(this.handleMutations.bind(this));

        this.logger.log('BuilderScore initialized');
    }

    private async requestPassportData(username: string): Promise<BuilderScoreResponse> {
        if (this.isTestMode) {
            await new Promise(resolve => setTimeout(resolve, 500));
            return {
                success: true,
                data: {
                    score: Math.floor(Math.random() * 100),
                    verified: Math.random() > 0.5,
                    displayName: username,
                    bio: '',
                    imageUrl: '',
                    socialProfiles: {},
                    skills: {
                        activity: Math.floor(Math.random() * 100),
                        identity: Math.floor(Math.random() * 100),
                        skills: Math.floor(Math.random() * 100)
                    },
                    lastUpdated: new Date().toISOString()
                }
            };
        }

        return new Promise((resolve) => {
            chrome.runtime.sendMessage(
                { type: 'GET_PASSPORT_DATA', username, platform: this.platformService.getCurrentPlatform() },
                (response: BuilderScoreResponse) => {
                    if (!response) {
                        resolve({
                            success: false,
                            error: 'No response from background service'
                        });
                        return;
                    }
                    resolve(response);
                }
            );
        });
    }

    private async injectBadge(element: Element): Promise<void> {
        if (this.processedElements.has(element)) return;

        const platform = this.platformService.getCurrentPlatform();
        const username = this.platformService.getUsername(platform, this.isTestMode);
        if (!username) return;

        const targetElement = this.platformService.getTargetElement(element, platform);
        if (!targetElement) return;

        try {
            const response = await this.requestPassportData(username);
            if (response.success && response.data) {
                const badge = this.badgeUIService.createBadge(
                    response.data,
                    platform,
                    username,
                    async () => {
                        try {
                            const newResponse = await this.requestPassportData(username);
                            if (newResponse.success && newResponse.data) {
                                const newBadge = this.badgeUIService.createBadge(
                                    newResponse.data,
                                    platform,
                                    username,
                                    async () => {
                                        // Update handler
                                        await this.updateBadge(username, badge);
                                    }
                                );
                                if (badge.parentNode) {
                                    badge.parentNode.replaceChild(newBadge, badge);
                                }
                            }
                        } catch (error) {
                            this.logger.error('Error updating badge:', error);
                        }
                    }
                );

                // Remove existing badge if present
                const existingBadge = targetElement.querySelector('.builder-score-badge');
                if (existingBadge) {
                    existingBadge.remove();
                }

                targetElement.appendChild(badge);
                this.processedElements.add(element);
            }
        } catch (error) {
            this.logger.error('Error in injectBadge:', error);
        }
    }


    private async updateBadge(username: string, badge: HTMLElement): Promise<void> {
        try {
            const response = await this.requestPassportData(username);
            if (response.success && response.data && badge.parentNode) {
                const newBadge = this.badgeUIService.createBadge(
                    response.data,
                    this.platformService.getCurrentPlatform(),
                    username,
                    () => this.updateBadge(username, badge)
                );
                badge.parentNode.replaceChild(newBadge, badge);
            }
        } catch (error) {
            this.logger.error('Error in updateBadge:', error);
        }
    }

    private handleMutations(mutations: MutationRecord[]): void {
        if (this.mutationTimeout) {
            clearTimeout(this.mutationTimeout);
        }

        this.mutationTimeout = setTimeout(() => {
            const platform = this.platformService.getCurrentPlatform();
            const selector = this.platformService.getSelector(platform);

            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (!this.processedElements.has(element)) {
                    this.injectBadge(element);
                }
            });

            this.mutationTimeout = null;
        }, CONFIG.MUTATION_DEBOUNCE);
    }

    public init(): void {
        const platform = this.platformService.getCurrentPlatform();
        const selector = this.platformService.getSelector(platform);

        const elements = document.querySelectorAll(selector);
        elements.forEach(element => this.injectBadge(element));

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    public destroy(): void {
        if (this.mutationTimeout) {
            clearTimeout(this.mutationTimeout);
        }
        this.observer.disconnect();
        document.querySelectorAll('.builder-score-badge').forEach(badge => badge.remove());
    }
}

// Initialize content script
const builderScore = new BuilderScoreController();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => builderScore.init());
} else {
    builderScore.init();
}

// Cleanup
window.addEventListener('unload', () => builderScore.destroy());