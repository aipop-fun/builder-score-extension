export function createSafeElement(tag: string, attributes: Record<string, string> = {}, textContent: string = ''): HTMLElement {
    const element = document.createElement(tag);

    // Safely set attributes
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else {
            element.setAttribute(key, value);
        }
    });

    // Safely set text content
    if (textContent) {
        element.textContent = textContent;
    }

    return element;
}

export function createSafeImage(src: string, alt: string, className: string = ''): HTMLImageElement {
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    if (className) {
        img.className = className;
    }
    return img;
}

export function appendChildren(parent: HTMLElement, children: HTMLElement[]): void {
    children.forEach(child => parent.appendChild(child));
}

export function createSvgElement(svgString: string): SVGElement {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    return doc.documentElement as SVGElement;
}

// Utility for creating verified badge icon
export function createVerifiedIcon(): HTMLElement {
    const icon = document.createElement('span');
    icon.className = 'verified-icon';
    icon.textContent = '✓';
    icon.style.cssText = 'font-size: 12px; margin-left: 4px;';
    return icon;
}

// Safe template creation utility
export function createSafeTemplate(data: Record<string, string | number>): HTMLElement {
    const container = document.createElement('div');

    // Create and append elements safely
    const titleElement = document.createElement('h3');
    titleElement.textContent = String(data.title || '');
    container.appendChild(titleElement);

    if (data.description) {
        const descElement = document.createElement('p');
        descElement.textContent = String(data.description);
        container.appendChild(descElement);
    }

    return container;
}