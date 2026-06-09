import { Skippy } from './Skippy.js';
import { Api } from './Api.js';
import { Auth } from './Auth.js';
import { Chat } from './Chat.js';
import { Carousel } from './Carousel.js';

// Инициализация сервисов
const skippy = new Skippy();
const api = new Api();
const auth = new Auth();
const chat = new Chat(auth, skippy);
const carousel = new Carousel(auth, skippy);

// DOM Элементы
const ui = {
    authScreen: document.getElementById('authScreen'),
    mainContent: document.getElementById('mainContent'),
    roleSelection: document.getElementById('roleSelection'),
    passwordForm: document.getElementById('passwordForm'),
    guestAuthForm: document.getElementById('guestAuthForm'),
    adminPanel: document.getElementById('adminPanel'),
    guestChatPanel: document.getElementById('guestChatPanel'),
    userStatusPanel: document.getElementById('userStatusPanel')
};

let guestAuthMode = 'login';

// Старт программы
window.addEventListener('DOMContentLoaded', async () => {
    const loadingStatus = document.getElementById('loadingStatus');
    const items = await api.fetchItems();
    carousel.setItems(items);

        if (items.length > 1) {
        loadingStatus.innerText = "AJAX UPLINK STABLE // DATA SYNCED";
        loadingStatus.className = "text-[11px] text-emerald-400 font-bold uppercase tracking-widest";
        setTimeout(() => skippy.talk("Bum! Sieć zhakowana. Pliki załadowane na twój HUD!"), 180);
    } else {
        loadingStatus.innerText = "LINK FAIL // OFFLINE ACTIVE";
    }
    ui.roleSelection.classList.remove('hidden');
    window.addEventListener('resize', () => carousel.render());
});

// Навигация
document.getElementById('btnNext').addEventListener('click', () => carousel.next());
document.getElementById('btnPrev').addEventListener('click', () => carousel.prev());
window.addEventListener('keydown', (e) => {
    if (window.innerWidth < 768 || ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (e.key === 'ArrowRight') carousel.next();
    if (e.key === 'ArrowLeft') carousel.prev();
});

// Авторизация Админа
document.getElementById('btnAdminMode').addEventListener('click', () => {
    ui.roleSelection.classList.add('hidden');
    ui.passwordForm.classList.remove('hidden');
});
document.getElementById('btnSubmitPassword').addEventListener('click', checkAdmin);
document.getElementById('btnCancelPassword').addEventListener('click', resetAuthUi);

function checkAdmin() {
    const pwd = document.getElementById('passwordInput').value;
    if (auth.loginAdmin(pwd)) loginUI('admin');
    else document.getElementById('passwordError').classList.remove('hidden');
}

// Авторизация Гостя
document.getElementById('btnGuestLogin').addEventListener('click', () => showGuestForm('login'));
document.getElementById('btnGuestRegister').addEventListener('click', () => showGuestForm('register'));
document.getElementById('btnGuestCancel').addEventListener('click', resetAuthUi);
document.getElementById('btnGuestSubmit').addEventListener('click', handleGuest);
document.getElementById('guestUsername').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleGuest(); }});
document.getElementById('guestPassword').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleGuest(); }});

document.getElementById('passwordInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); checkAdmin(); }});

function showGuestForm(mode) {
    guestAuthMode = mode;
    ui.roleSelection.classList.add('hidden');
    ui.guestAuthForm.classList.remove('hidden');
    document.getElementById('btnGuestSubmit').innerText = mode === 'register' ? 'REGISTER' : 'LOGIN';
}

function handleGuest() {
    const user = document.getElementById('guestUsername').value.trim();
    const pwd = document.getElementById('guestPassword').value.trim();
    const msgEl = document.getElementById('guestAuthMessage');
    
    if (!user || !pwd) {
        msgEl.innerText = "CREDENTIALS REQUIRED";
        msgEl.classList.remove('hidden');
        return;
    }

    const res = guestAuthMode === 'register' ? auth.registerGuest(user, pwd) : auth.loginGuest(user, pwd);
    
    if (res.success) {
        loginUI('guest');
    } else {
        msgEl.innerText = res.msg;
        msgEl.classList.remove('hidden');
    }
}

// Логика перехода в интерфейс
function loginUI(role) {
    ui.authScreen.classList.add('hidden');
    ui.mainContent.classList.remove('hidden');
    document.getElementById('roleLabel').innerText = role.toUpperCase();
    
    if (role === 'admin') {
        document.getElementById('formToggle').style.display = 'flex';
        // render user statuses for admin as well
        chat.renderUserStatus();
    } else {
        ui.guestChatPanel.classList.remove('hidden');
        ui.guestChatPanel.style.display = 'flex';
        chat.renderChat();
        chat.renderUserStatus();
        document.getElementById('chatUserLabel').innerText = `USER: ${auth.currentGuest}`;
        startHeartbeat();
    }
    
    ui.userStatusPanel.classList.remove('hidden');
    carousel.render();
}

function resetAuthUi() {
    ui.passwordForm.classList.add('hidden');
    ui.guestAuthForm.classList.add('hidden');
    ui.roleSelection.classList.remove('hidden');
}

// Выход
document.getElementById('btnLogout').addEventListener('click', () => {
    auth.logout();
    ui.mainContent.classList.add('hidden');
    ui.authScreen.classList.remove('hidden');
    resetAuthUi();
    ui.adminPanel.style.display = 'none';
    ui.guestChatPanel.style.display = 'none';
    // update user statuses when someone logs out
    chat.renderUserStatus();
    stopHeartbeat();
});

// Чат
document.getElementById('btnSendChat').addEventListener('click', () => {
    const input = document.getElementById('chatInput');
    chat.sendMessage(input.value);
    input.value = '';
});
document.getElementById('chatInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const input = e.target;
        chat.sendMessage(input.value);
        input.value = '';
    }
});
document.getElementById('btnToggleChat').addEventListener('click', (e) => {
    const collapsed = ui.guestChatPanel.classList.toggle('collapsed');
    e.target.innerText = collapsed ? '⯈' : '⯆';
});

// Toggle collapse for user status panel
const userStatusToggleBtn = document.getElementById('btnToggleUserStatus');
if (userStatusToggleBtn) {
    userStatusToggleBtn.addEventListener('click', () => {
        const collapsed = ui.userStatusPanel.classList.toggle('collapsed');
        userStatusToggleBtn.innerText = collapsed ? '⯈' : '⯆';
        if (!collapsed) chat.renderUserStatus();
    });
}

// Добавление предмета Админом
let showForm = false;
document.getElementById('formToggle').addEventListener('click', () => {
    if (auth.userRole !== 'admin') return;
    showForm = !showForm;
    ui.adminPanel.style.display = showForm ? 'flex' : 'none';
});
document.getElementById('btnCreateItem').addEventListener('click', () => {
    if (auth.userRole !== 'admin') {
        alert('ACCESS DENIED');
        return;
    }
    const title = document.getElementById('newTitle').value;
    const price = Number(document.getElementById('newPrice').value) || 0;
    const imgUrl = document.getElementById('newImgUrl').value;
    if (title) carousel.addItem(title, price, imgUrl);
    showForm = false;
    ui.adminPanel.style.display = 'none';
});

// Heartbeat for marking guest online and cleanup on unload
let onlineHeartbeatId = null;
function beforeUnloadHandler() {
    if (auth.currentGuest) auth.markOffline(auth.currentGuest);
}
function startHeartbeat() {
    if (!auth.currentGuest) return;
    auth.markOnline(auth.currentGuest);
    if (onlineHeartbeatId) clearInterval(onlineHeartbeatId);
    onlineHeartbeatId = setInterval(() => {
        if (auth.currentGuest) auth.markOnline(auth.currentGuest);
        else stopHeartbeat();
    }, 30000);
    window.addEventListener('beforeunload', beforeUnloadHandler);
}
function stopHeartbeat() {
    if (onlineHeartbeatId) { clearInterval(onlineHeartbeatId); onlineHeartbeatId = null; }
    window.removeEventListener('beforeunload', beforeUnloadHandler);
}