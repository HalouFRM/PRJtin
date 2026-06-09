export class Chat {
    constructor(auth, skippy) {
        this.auth = auth;
        this.skippy = skippy;
        this.GUEST_CHAT_KEY = 'wishlist_chat_messages';
        this.chatMessagesEl = document.getElementById('chatMessages');
        this.chatReactionTypes = ['👍', '❤️', '😲', '🔥', '💀'];
        this.initStorageListener();
    }

    getMessages() {
        return JSON.parse(localStorage.getItem(this.GUEST_CHAT_KEY) || '[]');
    }

    saveMessages(messages) {
        localStorage.setItem(this.GUEST_CHAT_KEY, JSON.stringify(messages));
    }

    initStorageListener() {
        window.addEventListener('storage', (e) => {
            if (e.key === this.GUEST_CHAT_KEY && this.auth.userRole === 'guest') {
                this.renderChat();
            }
            if (e.key === this.auth.ONLINE_USERS_KEY) {
                this.renderUserStatus();
            }
        });
    }

    sendMessage(text) {
        if (this.auth.userRole !== 'guest' || !this.auth.currentGuest || !text.trim()) return;
        
        const messages = this.getMessages();
        messages.push({
            id: Date.now() + Math.floor(Math.random() * 1000),
            user: this.auth.currentGuest,
            text: text.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            reactions: {},
            userReactions: {}
        });
        this.saveMessages(messages);
        this.renderChat();
    }

    toggleReaction(messageId, emoji) {
        if (!this.auth.currentGuest) return;
        const messages = this.getMessages();
        const msg = messages.find(m => m.id === messageId);
        if (!msg) return;

        msg.reactions = msg.reactions || {};
        msg.userReactions = msg.userReactions || {};
        const userReactions = msg.userReactions[this.auth.currentGuest] || [];
        const hasReacted = userReactions.includes(emoji);

        if (hasReacted) {
            msg.userReactions[this.auth.currentGuest] = userReactions.filter(r => r !== emoji);
            msg.reactions[emoji] = Math.max(0, (msg.reactions[emoji] || 1) - 1);
            if (msg.reactions[emoji] === 0) delete msg.reactions[emoji];
        } else {
            msg.userReactions[this.auth.currentGuest] = [...userReactions, emoji];
            msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1;
        }

        if (msg.userReactions[this.auth.currentGuest]?.length === 0) delete msg.userReactions[this.auth.currentGuest];
        this.saveMessages(messages);
        this.renderChat();
    }

    renderChat() {
        if (this.auth.userRole !== 'guest') return;
        const messages = this.getMessages();
        this.chatMessagesEl.innerHTML = '';
        
        messages.slice(-50).forEach((message) => {
            const messageEl = document.createElement('div');
            messageEl.className = 'guest-chat-message';
            messageEl.innerHTML = `<strong>${message.user}</strong>: ${this.escapeHtml(message.text)}<br><span class="text-[10px] text-white/60">${message.time}</span>`;

            const reactionBar = document.createElement('div');
            reactionBar.className = 'reaction-bar';
            
            this.chatReactionTypes.forEach((emoji) => {
                const count = message.reactions?.[emoji] || 0;
                const hasReacted = message.userReactions?.[this.auth.currentGuest]?.includes(emoji);
                const btn = document.createElement('button');
                btn.className = `reaction-button${hasReacted ? ' active' : ''}`;
                btn.innerHTML = `<span>${emoji}</span><span class="reaction-count">${count || ''}</span>`;
                btn.onclick = (e) => {
                    e.stopPropagation();
                    this.toggleReaction(message.id, emoji);
                };
                reactionBar.appendChild(btn);
            });

            messageEl.appendChild(reactionBar);
            this.chatMessagesEl.appendChild(messageEl);
        });
        this.chatMessagesEl.scrollTop = this.chatMessagesEl.scrollHeight;
    }

    renderUserStatus() {
        const accounts = this.auth.getAccounts();
        const allUsers = Object.keys(accounts).sort();
        const onlineUsers = this.auth.getOnlineUsers();
        const online = onlineUsers || [];
        const offline = allUsers.filter(u => !online.includes(u));

        document.getElementById('userStatusCounts').innerText = `${online.length}/${allUsers.length}`;
        const onlineListEl = document.getElementById('onlineList');
        const offlineListEl = document.getElementById('offlineList');
        
        onlineListEl.innerHTML = online.length ? online.map(u => `<li class="online">${u}</li>`).join('') : '<li class="user-status-empty">nobody online</li>';
        offlineListEl.innerHTML = offline.length ? offline.map(u => `<li class="offline">${u}</li>`).join('') : '<li class="user-status-empty">no offline agents</li>';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.innerText = text;
        return div.innerHTML;
    }
}