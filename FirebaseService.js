import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import {
    getDatabase,
    ref,
    get,
    onValue,
    set,
    update,
    push,
    remove
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

export class FirebaseService {
    constructor(config) {
        this.app = initializeApp(config);
        this.db = getDatabase(this.app);
    }

    ref(path) {
        return ref(this.db, path);
    }

    async getValue(path) {
        const snapshot = await get(this.ref(path));
        return snapshot.exists() ? snapshot.val() : null;
    }

    onValue(path, callback) {
        return onValue(this.ref(path), (snapshot) => callback(snapshot.exists() ? snapshot.val() : null));
    }

    async setValue(path, value) {
        await set(this.ref(path), value);
    }

    async updateValue(path, value) {
        await update(this.ref(path), value);
    }

    async pushValue(path, value) {
        await push(this.ref(path), value);
    }

    async removeValue(path) {
        await remove(this.ref(path));
    }
}
