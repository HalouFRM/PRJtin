export class Auth {
    constructor() {
        this.ADMIN_PASSWORD = '788228';
        this.GUEST_ACCOUNTS_KEY = 'wishlist_guest_accounts';
        this.ONLINE_USERS_KEY = 'wishlist_online_users';
        this.userRole = null;
        this.currentGuest = null;
    }

    getAccounts() {
        return JSON.parse(localStorage.getItem(this.GUEST_ACCOUNTS_KEY) || '{}');
    }

    saveAccounts(accounts) {
        localStorage.setItem(this.GUEST_ACCOUNTS_KEY, JSON.stringify(accounts));
    }

    loginAdmin(password) {
        if (password === this.ADMIN_PASSWORD) {
            this.userRole = 'admin';
            return true;
        }
        return false;
    }

    registerGuest(username, password) {
        const accounts = this.getAccounts();
        if (accounts[username]) return { success: false, msg: 'ACCOUNT ALREADY EXISTS' };
        
        accounts[username] = password;
        this.saveAccounts(accounts);
        return this.loginGuest(username, password);
    }

    loginGuest(username, password) {
        const accounts = this.getAccounts();
        if (accounts[username] && accounts[username] === password) {
            this.userRole = 'guest';
            this.currentGuest = username;
            this.markOnline(username);
            return { success: true, msg: 'WELCOME' };
        }
        return { success: false, msg: 'INVALID CREDENTIALS' };
    }

    logout() {
        if (this.currentGuest) this.markOffline(this.currentGuest);
        this.userRole = null;
        this.currentGuest = null;
    }

    getOnlineUsers() {
        try {
            const raw = JSON.parse(localStorage.getItem(this.ONLINE_USERS_KEY) || '[]');
            const now = Date.now();
            const TIMEOUT = 1000 * 60 * 2; // 2 minutes
            if (!Array.isArray(raw)) return [];
            return raw.filter(entry => (now - (entry.lastSeen || 0)) <= TIMEOUT).map(e => e.user);
        } catch (e) {
            return [];
        }
    }

    saveOnlineUsers(list) {
        localStorage.setItem(this.ONLINE_USERS_KEY, JSON.stringify(list));
    }

    markOnline(username) {
        try {
            const raw = JSON.parse(localStorage.getItem(this.ONLINE_USERS_KEY) || '[]');
            const now = Date.now();
            let list = Array.isArray(raw) ? raw : [];
            const idx = list.findIndex(e => e.user === username);
            if (idx >= 0) list[idx].lastSeen = now;
            else list.push({ user: username, lastSeen: now });
            this.saveOnlineUsers(list);
        } catch (e) {
            this.saveOnlineUsers([{ user: username, lastSeen: Date.now() }]);
        }
    }

    markOffline(username) {
        try {
            const raw = JSON.parse(localStorage.getItem(this.ONLINE_USERS_KEY) || '[]');
            let list = Array.isArray(raw) ? raw : [];
            list = list.filter(e => e.user !== username);
            this.saveOnlineUsers(list);
        } catch (e) {
            this.saveOnlineUsers([]);
        }
    }
}