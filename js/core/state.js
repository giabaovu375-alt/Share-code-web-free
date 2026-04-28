class AppState {
    constructor() {
        this.state = {
            products: [],
            currentCategory: 'all',
            currentUser: null,
            globalStats: { views: 0, downloads: 0 },
            loading: true
        };
        this.listeners = [];
    }

    get(key) { return this.state[key]; }
    set(key, value) {
        this.state[key] = value;
        this.notify(key, value);
    }
    subscribe(key, callback) {
        this.listeners.push({ key, callback });
    }
    notify(key, value) {
        this.listeners.forEach(l => {
            if (l.key === key) l.callback(value);
        });
    }
    removeListener(callback) {
        this.listeners = this.listeners.filter(l => l.callback !== callback);
    }
}

export const appState = new AppState();
