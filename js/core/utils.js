export function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

export function truncate(str, len = 60) {
    return str.length > len ? str.substring(0, len) + '...' : str;
}

export function formatNumber(num) {
    return num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num;
}

export function debounce(func, delay) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => func(...args), delay); };
}

// Toast Manager
class ToastManager {
    constructor() {
        this.container = document.getElementById('toast-root') || this._createContainer();
        this.timer = null;
    }

    _createContainer() {
        const container = document.createElement('div');
        container.id = 'toast-root';
        container.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;align-items:center;gap:8px;';
        document.body.appendChild(container);
        return container;
    }

    show(message, type = 'info') {
        if (this.timer) clearTimeout(this.timer);
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        this.container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        this.timer = setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

export const toast = new ToastManager();
