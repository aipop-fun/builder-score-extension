// types.ts
interface PopupData {
    score: number;
    verified: boolean;
    skills: {
        activity: number;
        identity: number;
        skills: number;
    };
    socialProfiles: {
        github?: {
            profile_url: string;
            follower_count: number;
        };
        twitter?: {
            profile_url: string;
            follower_count: number;
        };
        farcaster?: {
            profile_url: string;
            follower_count: number;
        };
    };
    passport_id: number;
    displayName: string;
    imageUrl: string;
    bio: string;
}

// popup.ts
class PopupComponent {
    private popup: HTMLElement | null = null;
    private isVisible = false;
    private readonly baseStyles = {
        popup: `
            position: absolute;
            z-index: 9999;
            width: 320px;
            background-color: var(--popup-bg, #ffffff);
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            border: 1px solid rgba(0, 0, 0, 0.1);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: var(--text-color, #1f2937);
            overflow: hidden;
            transition: opacity 0.2s ease, transform 0.2s ease;
        `,
        header: `
            padding: 16px;
            background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
            color: #ffffff;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        `,
        content: `
            padding: 16px;
            background: var(--content-bg, #ffffff);
        `,
        skillBar: `
            height: 6px;
            background: var(--bar-bg, #e5e7eb);
            border-radius: 3px;
            overflow: hidden;
            margin-top: 4px;
        `,
        skillProgress: `
            height: 100%;
            background: #8b5cf6;
            border-radius: 3px;
            transition: width 0.3s ease;
        `,
        footer: `
            padding: 12px 16px;
            background: var(--footer-bg, #f9fafb);
            border-top: 1px solid rgba(0, 0, 0, 0.1);
            text-align: right;
        `
    };

    constructor(private data: PopupData) {
        this.handleTheme();
    }

    private handleTheme(): void {
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isDarkMode) {
            document.documentElement.style.setProperty('--popup-bg', '#1f2937');
            document.documentElement.style.setProperty('--content-bg', '#1f2937');
            document.documentElement.style.setProperty('--footer-bg', '#111827');
            document.documentElement.style.setProperty('--text-color', '#f3f4f6');
            document.documentElement.style.setProperty('--bar-bg', '#4b5563');
        }
    }

    public show(anchorElement: HTMLElement): void {
        if (this.isVisible) return;
        
        this.createPopup();
        this.positionPopup(anchorElement);
        this.addEventListeners();
        
        // Animate in
        requestAnimationFrame(() => {
            if (this.popup) {
                this.popup.style.opacity = '1';
                this.popup.style.transform = 'translateY(0)';
            }
        });
        
        this.isVisible = true;
    }

    public hide(): void {
        if (!this.isVisible || !this.popup) return;
        
        // Animate out
        this.popup.style.opacity = '0';
        this.popup.style.transform = 'translateY(-8px)';
        
        setTimeout(() => {
            if (this.popup && this.popup.parentNode) {
                this.popup.parentNode.removeChild(this.popup);
                this.popup = null;
                this.isVisible = false;
            }
        }, 200);
    }

    private createAvatar(imageUrl: string, displayName: string): string {
        // Verificar se a URL da imagem é válida
        const validImageUrl = imageUrl && imageUrl.startsWith('http') ? imageUrl : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="%238b5cf6"/><text x="50%" y="50%" fill="white" text-anchor="middle" dy=".3em" font-family="Arial" font-size="16">${displayName.charAt(0).toUpperCase()}</text></svg>';

        return `
        <div style="flex-shrink: 0; width: 40px; height: 40px; border-radius: 20px; overflow: hidden; background-color: #8b5cf6;">
            <img src="${validImageUrl}" 
                 alt="${displayName}" 
                 style="width: 100%; height: 100%; object-fit: cover;"
                 onerror="this.style.display='none'; this.parentElement.innerHTML = '<div style=\'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; font-weight: bold;\'>${displayName.charAt(0).toUpperCase()}</div>';">
        </div>
    `;
    }

    private createPopup(): void {
        this.popup = document.createElement('div');
        this.popup.style.cssText = this.baseStyles.popup;
        this.popup.style.opacity = '0';
        this.popup.style.transform = 'translateY(-8px)';

        this.popup.innerHTML = `
            <div style="${this.baseStyles.header}">
                <div style="display: flex; align-items: center; gap: 12px;">
                    ${this.createAvatar(this.data.imageUrl, this.data.displayName)}
                    <div>
                        <h3 style="margin: 0; font-size: 16px; font-weight: 600;">
                            ${this.data.displayName}
                        </h3>
                        <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                            <span style="font-size: 14px;">Score: ${this.data.score}</span>
                            ${this.data.verified ? 
                                '<span style="background: #22c55e; padding: 2px 8px; border-radius: 12px; font-size: 12px;">Verified</span>' : 
                                ''}
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="${this.baseStyles.content}">
                ${this.data.bio ? `
                    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5;">
                        ${this.data.bio}
                    </p>
                ` : ''}
                
                <div style="margin-bottom: 16px;">
                    <h4 style="margin: 0 0 12px 0; font-size: 14px; color: var(--text-color, #6b7280);">
                        Builder Skills
                    </h4>
                    ${this.createSkillBars()}
                </div>
                
                ${this.createSocialLinks()}
            </div>

            <div style="${this.baseStyles.footer}">
                <a href="https://app.talentprotocol.com/profile/${this.data.passport_id}" 
                   target="_blank" 
                   style="text-decoration: none; color: #8b5cf6; font-size: 14px; font-weight: 500;">
                    View Full Profile →
                </a>
            </div>
        `;
    }

    private createSkillBars(): string {
        const skills = [
            { name: 'Activity', value: this.data.skills.activity },
            { name: 'Identity', value: this.data.skills.identity },
            { name: 'Skills', value: this.data.skills.skills }
        ];

        return skills.map(skill => `
            <div style="margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                    <span style="font-size: 13px; color: var(--text-color, #4b5563);">
                        ${skill.name}
                    </span>
                    <span style="font-size: 13px; color: var(--text-color, #6b7280);">
                        ${skill.value}%
                    </span>
                </div>
                <div style="${this.baseStyles.skillBar}">
                    <div style="${this.baseStyles.skillProgress}; width: ${skill.value}%"></div>
                </div>
            </div>
        `).join('');
    }

    private createSocialLinks(): string {
        const socials = [];
        
        if (this.data.socialProfiles.twitter) {
            socials.push({
                name: 'Twitter',
                icon: '🐦',
                url: this.data.socialProfiles.twitter.profile_url,
                followers: this.data.socialProfiles.twitter.follower_count
            });
        }

        if (this.data.socialProfiles.github) {
            socials.push({
                name: 'GitHub',
                icon: '💻',
                url: this.data.socialProfiles.github.profile_url,
                followers: this.data.socialProfiles.github.follower_count
            });
        }

        if (this.data.socialProfiles.farcaster) {
            socials.push({
                name: 'Farcaster',
                icon: '📡',
                url: this.data.socialProfiles.farcaster.profile_url,
                followers: this.data.socialProfiles.farcaster.follower_count
            });
        }

        if (socials.length === 0) return '';

        return `
            <div>
                <h4 style="margin: 0 0 8px 0; font-size: 14px; color: var(--text-color, #6b7280);">
                    Connected Accounts
                </h4>
                ${socials.map(social => `
                    <a href="${social.url}" 
                       target="_blank" 
                       style="display: flex; align-items: center; justify-content: space-between;
                              text-decoration: none; color: var(--text-color, #4b5563);
                              padding: 8px 0; border-bottom: 1px solid rgba(128, 128, 128, 0.2);">
                        <span style="display: flex; align-items: center; gap: 8px; font-size: 14px;">
                            <span style="font-size: 16px;">${social.icon}</span>
                            ${social.name}
                        </span>
                        <span style="font-size: 13px; color: var(--text-color, #6b7280);">
                            ${social.followers.toLocaleString()} followers
                        </span>
                    </a>
                `).join('')}
            </div>
        `;
    }

    private positionPopup(anchorElement: HTMLElement): void {
        if (!this.popup) return;

        const rect = anchorElement.getBoundingClientRect();
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Calculate initial position (below the anchor)
        let top = rect.bottom + scrollTop + 8;
        let left = rect.left + scrollLeft - (320 - rect.width) / 2; // Center align

        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Ensure popup stays within viewport horizontally
        if (left < 16) {
            left = 16; // Minimum margin from left
        } else if (left + 320 > viewportWidth - 16) {
            left = viewportWidth - 336; // 320 + 16px margin
        }

        // Check if popup would go below viewport
        if (top + 400 > viewportHeight + scrollTop) { // Approximate max height
            // Position above the anchor instead
            top = rect.top + scrollTop - 8;
            this.popup.style.transformOrigin = 'bottom center';
        } else {
            this.popup.style.transformOrigin = 'top center';
        }

        Object.assign(this.popup.style, {
            top: `${top}px`,
            left: `${left}px`
        });

        document.body.appendChild(this.popup);
    }

    private addEventListeners(): void {
        if (!this.popup) return;

        // Close when clicking outside
        const handleClick = (e: MouseEvent) => {
            if (this.popup && !this.popup.contains(e.target as Node)) {
                this.hide();
                document.removeEventListener('click', handleClick);
            }
        };

        // Delay adding click listener to prevent immediate closing
        setTimeout(() => {
            document.addEventListener('click', handleClick);
        }, 0);

        // Close on escape key
        const handleKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                this.hide();
                document.removeEventListener('keydown', handleKeydown);
            }
        };

        document.addEventListener('keydown', handleKeydown);

        // Handle theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', () => this.handleTheme());
    }
}

export default PopupComponent;