export class Api {
    constructor(firebaseService = null) {
        this.firebase = firebaseService;
    }

    async fetchItems() {
        const STORAGE_KEY = 'wishlist_items';
        if (this.firebase) {
            try {
                const remote = await this.firebase.getValue(STORAGE_KEY);
                if (Array.isArray(remote) && remote.length) {
                    return remote;
                }
            } catch (e) {
                // fallback to local cache and network
            }
        }

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length) return parsed;
            }
        } catch (e) {
            // ignore parse errors and fallback to network
        }
        try {
            const response = await fetch('https://jsonplaceholder.typicode.com/users');
            if (!response.ok) throw new Error();
            const users = await response.json();
            
            const images = [
                'https://picsum.photos/id/180/900/1200',
                'https://picsum.photos/id/48/900/1200',
                'https://picsum.photos/id/1060/900/1200',
                'https://picsum.photos/id/212/900/1200',
                'https://picsum.photos/id/357/900/1200'
            ];

            const items = users.slice(0, 5).map((user, index) => ({
                id: user.id,
                title: user.company.name,
                price: (user.id * 7000) + 1500,
                imgUrl: images[index] || images[0],
                isReceived: false,
                status: ''
            }));
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (e) {}
            if (this.firebase) {
                try { await this.firebase.setValue(STORAGE_KEY, items); } catch (e) {}
            }
            return items;
        } catch (error) {
            const fallback = [{ id: 1, title: 'Keychron K2', price: 9000, imgUrl: 'https://picsum.photos/id/180/900/1200', isReceived: false, status: '' }];
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback)); } catch (e) {}
            if (this.firebase) {
                try { await this.firebase.setValue(STORAGE_KEY, fallback); } catch (e) {}
            }
            return fallback;
        }
    }
}