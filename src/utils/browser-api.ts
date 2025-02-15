export const browserAPI = {
    runtime: {
        sendMessage: (message: any): Promise<any> => {
            if (typeof browser !== 'undefined') {
                return browser.runtime.sendMessage(message);
            }
            return new Promise((resolve) => {
                chrome.runtime.sendMessage(message, (response) => {
                    resolve(response);
                });
            });
        },

        onMessage: {
            addListener: (callback: (message: any, sender: any, sendResponse: any) => Promise<any> | void) => {
                if (typeof browser !== 'undefined') {
                    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
                        const response = callback(message, sender, sendResponse);
                        if (response !== null && typeof response === 'object' && 'then' in response) {
                            response.then(sendResponse);
                            return true;
                        }
                        return false;
                    });
                } else {
                    chrome.runtime.onMessage.addListener(callback);
                }
            }
        }
    },

    storage: {
        local: {
            get: (keys: string | string[] | null): Promise<any> => {
                if (typeof browser !== 'undefined') {
                    return browser.storage.local.get(keys);
                }
                return new Promise((resolve) => {
                    chrome.storage.local.get(keys, (result) => {
                        resolve(result);
                    });
                });
            },

            set: (items: { [key: string]: any }): Promise<void> => {
                if (typeof browser !== 'undefined') {
                    return browser.storage.local.set(items);
                }
                return new Promise((resolve) => {
                    chrome.storage.local.set(items, () => {
                        resolve();
                    });
                });
            }
        }
    }
};

// Add type definitions for Firefox's browser API
declare global {
    interface Window {
        browser: typeof chrome;
    }
    const browser: typeof chrome;
}