export class Auth {
    constructor(firebaseService = null) {
        this.firebase = firebaseService;
        this.ADMIN_PASSWORD = '788228';
        this.GUEST_ACCOUNTS_KEY = 'wishlist_guest_accounts';
        this.ONLINE_USERS_KEY = 'wishlist_online_users';
        this.userRole = null;
        this.currentGuest = null;
    }

    async getAccounts() {
        if (this.firebase) {
            try {
                const accounts = await this.firebase.getValue(this.GUEST_ACCOUNTS_KEY);
                if (accounts && typeof accounts === 'object') return accounts;
            } catch (e) {
                // fallback to local storage
            }
        }
        return JSON.parse(localStorage.getItem(this.GUEST_ACCOUNTS_KEY) || '{}');
    }

    async saveAccounts(accounts) {
        if (this.firebase) {
            try {
                await this.firebase.setValue(this.GUEST_ACCOUNTS_KEY, accounts);
                return;
            } catch (e) {
                // fallback to local storage
            }
        }
        localStorage.setItem(this.GUEST_ACCOUNTS_KEY, JSON.stringify(accounts));
    }

    loginAdmin(password) {
        if (password === this.ADMIN_PASSWORD) {
            this.userRole = 'admin';
            return true;
        }
        return false;
    }

    async registerGuest(username, password) {
        const accounts = await this.getAccounts();
        if (accounts[username]) return { success: false, msg: 'ACCOUNT ALREADY EXISTS' };
        
        accounts[username] = password;
        await this.saveAccounts(accounts);
        return this.loginGuest(username, password);
    }

    async loginGuest(username, password) {
        const accounts = await this.getAccounts();
        if (accounts[username] && accounts[username] === password) {
            this.userRole = 'guest';
            this.currentGuest = username;
            await this.markOnline(username);
            return { success: true, msg: 'WELCOME' };
        }
        return { success: false, msg: 'INVALID CREDENTIALS' };
    }

    async logout() {
        if (this.currentGuest) await this.markOffline(this.currentGuest);
        this.userRole = null;
        this.currentGuest = null;
    }

    async getOnlineUsers() {
        if (this.firebase) {
            try {
                const raw = await this.firebase.getValue(this.ONLINE_USERS_KEY);
                const now = Date.now();
                const TIMEOUT = 1000 * 60 * 2; // 2 minutes
                if (!raw || typeof raw !== 'object') return [];
                return Object.entries(raw)
                    .filter(([, entry]) => (now - (entry?.lastSeen || 0)) <= TIMEOUT)
                    .map(([user]) => user);
            } catch (e) {
                // fallback to local storage
            }
        }

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

    async saveOnlineUsers(list) {
        if (this.firebase) {
            try {
                await this.firebase.setValue(this.ONLINE_USERS_KEY, list);
                return;
            } catch (e) {
                // fallback to local storage
            }
        }
        localStorage.setItem(this.ONLINE_USERS_KEY, JSON.stringify(list));
    }

    async markOnline(username) {
        if (this.firebase) {
            try {
                const raw = await this.firebase.getValue(this.ONLINE_USERS_KEY) || {};
                raw[username] = { lastSeen: Date.now() };
                await this.firebase.setValue(this.ONLINE_USERS_KEY, raw);
                return;
            } catch (e) {
                // fallback to local storage
            }
        }

        try {
            const raw = JSON.parse(localStorage.getItem(this.ONLINE_USERS_KEY) || '[]');
            const now = Date.now();
            let list = Array.isArray(raw) ? raw : [];
            const idx = list.findIndex(e => e.user === username);
            if (idx >= 0) list[idx].lastSeen = now;
            else list.push({ user: username, lastSeen: now });
            await this.saveOnlineUsers(list);
        } catch (e) {
            await this.saveOnlineUsers([{ user: username, lastSeen: Date.now() }]);
        }
    }

    async markOffline(username) {
        if (this.firebase) {
            try {
                const raw = await this.firebase.getValue(this.ONLINE_USERS_KEY) || {};
                if (raw && typeof raw === 'object') {
                    delete raw[username];
                    await this.firebase.setValue(this.ONLINE_USERS_KEY, raw);
                    return;
                }
            } catch (e) {
                // fallback to local storage
            }
        }

        try {
            const raw = JSON.parse(localStorage.getItem(this.ONLINE_USERS_KEY) || '[]');
            let list = Array.isArray(raw) ? raw : [];
            list = list.filter(e => e.user !== username);
            await this.saveOnlineUsers(list);
        } catch (e) {
            await this.saveOnlineUsers([]);
        }
    }
}