export class Carousel {
    constructor(auth, skippy) {
        this.auth = auth;
        this.skippy = skippy;
        this.carouselEl = document.getElementById('carousel');
        this.sceneEl = document.getElementById('scene');
        this.STORAGE_KEY = 'wishlist_items';
        this.items = [];
        this.guestStatuses = JSON.parse(localStorage.getItem('my_wishlist_statuses')) || {};
        this.currentIndex = 0;
        this.rotationIndex = 0;
        this.activeCardId = null;
        this.isUpdatingScroll = false;
        
        this.initScrollListener();
        window.addEventListener('storage', (e) => {
            if (e.key === this.STORAGE_KEY) {
                try {
                    const newItems = JSON.parse(e.newValue || '[]');
                    this.setItems(newItems);
                    this.render();
                } catch (err) {
                    // ignore parse errors
                }
            }
        });
    }

    setItems(items) {
        this.items = items;
        this.items.forEach(item => {
            if (this.guestStatuses[item.id]) item.status = this.guestStatuses[item.id];
        });
    }

    addItem(title, price, imgUrl) {
        this.items.push({ id: Date.now(), title, price, imgUrl, isReceived: false, status: '' });
        this.render();
        this.skippy.talk("🚨 Wpis pomyślnie dodany do głównego katalogu Arasaki!");
        try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items)); } catch (e) {}
    }

    deleteItem(id) {
        this.items = this.items.filter(i => i.id !== id);
        this.activeCardId = null;
        this.render();
        this.skippy.talk("⚠️ Plik usunięty bezpowrotnie! Tylko we mnie nie celuj!", true);
        try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items)); } catch (e) {}
    }

    updateStatus(item, newStatus) {
        if (newStatus === 'none' || newStatus === '') {
            item.status = ''; 
            delete this.guestStatuses[item.id];
            this.skippy.talk("Ej! Po co kasujesz status? Kup mi lepiej amunicję!", true);
        } else {
            item.status = newStatus; 
            this.guestStatuses[item.id] = newStatus;
            this.skippy.talk("Świetny wybór, V! Uruchamiam protokół rezerwacji celu.");
        }
        localStorage.setItem('my_wishlist_statuses', JSON.stringify(this.guestStatuses));
        this.render();
    }

    render() {
        const isMobile = window.innerWidth < 768;
        const prevScroll = isMobile && this.sceneEl ? this.sceneEl.scrollLeft : 0;

        this.carouselEl.innerHTML = '';
        const len = this.items.length;
        if (len === 0) return;

        const angleStep = 360 / len;
        const radius = Math.max(300, len * 60);

        this.carouselEl.style.transform = isMobile ? 'none' : `rotateY(${-this.rotationIndex * angleStep}deg)`;

        if (isMobile && this.sceneEl) {
            this.isUpdatingScroll = true;
        }

        this.items.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = `card-item ${item.isReceived ? 'received' : ''} ${(!isMobile && this.activeCardId === item.id) ? 'zoomed' : ''}`;
            
            if (!isMobile) {
                const rot = index * angleStep;
                card.style.transform = this.activeCardId === item.id 
                    ? `rotateY(${rot}deg) translateZ(${radius + 60}px) scale(1.1)` 
                    : `rotateY(${rot}deg) translateZ(${radius}px)`;
            } else {
                card.style.transform = this.activeCardId === item.id ? 'scale(1.05)' : 'none';
                card.style.zIndex = this.activeCardId === item.id ? '10' : '1';
            }

            card.addEventListener('click', () => {
                if (this.auth.userRole === 'admin') {
                    item.isReceived = !item.isReceived;
                    this.render();
                    this.skippy.talk(item.isReceived ? "🎯 Bam! Cel zlikwidowany!" : "Plik przywrócony w systemie.");
                } else {
                    this.activeCardId = this.activeCardId === item.id ? null : item.id;
                    this.render();
                }
            });

            card.innerHTML = `
                <div class="card-img-wrapper"><img src="${item.imgUrl}" class="card-img"></div>
                <div class="flex flex-col flex-grow pt-3 justify-between">
                    <div>
                        <h3 class="font-bold text-md text-white tracking-wide truncate">${item.title}</h3>
                        <p class="text-xs font-bold text-amber-300 mt-1 mb-2">${item.price.toLocaleString()} E$</p>
                        ${item.status || item.isReceived ? `<div class="text-[9px] font-bold tracking-widest border p-1 text-center mb-2 ${item.isReceived ? 'border-yellow-500 bg-yellow-950/20 text-yellow-400' : 'border-cyan-400 bg-cyan-950/40 text-cyan-300'}">STATE: ${item.isReceived ? 'RECEIVED' : item.status.toUpperCase()}</div>` : ''}
                    </div>
                </div>
            `;

            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'flex flex-col gap-2 z-10';
            controlsDiv.onclick = (e) => e.stopPropagation();

            if (this.auth.userRole === 'guest') {
                const select = document.createElement('select');
                select.className = 'status-select';
                select.innerHTML = `
                    <option value="" ${!item.status ? 'selected' : ''}>-- STATUS --</option>
                    <option value="buy" ${item.status === 'buy' ? 'selected' : ''}>🛒 Куплю</option>
                    <option value="think" ${item.status === 'think' ? 'selected' : ''}>🤔 Думаю</option>
                    <option value="split" ${item.status === 'split' ? 'selected' : ''}>🎁 Скинемся</option>
                    <option value="none">❌ Сброс</option>
                `;
                select.onchange = (e) => this.updateStatus(item, e.target.value);
                controlsDiv.appendChild(select);
            }

            if (this.auth.userRole === 'admin') {
                const btnDel = document.createElement('button');
                btnDel.className = 'text-rose-500 font-bold hover:underline tracking-widest text-[9px] uppercase mt-2 text-right w-full';
                btnDel.innerText = '[PURGE_DELETE]';
                btnDel.onclick = () => this.deleteItem(item.id);
                controlsDiv.appendChild(btnDel);
            }

            card.lastElementChild.appendChild(controlsDiv);
            this.carouselEl.appendChild(card);
        });

        if (isMobile && this.sceneEl) {
            this.sceneEl.scrollLeft = prevScroll;
            this.isUpdatingScroll = false;
        }
    }

    next() {
        this.rotationIndex += 1;
        this.activeCardId = this.items[((this.rotationIndex % this.items.length) + this.items.length) % this.items.length]?.id;
        this.render();
    }

    prev() {
        this.rotationIndex -= 1;
        this.activeCardId = this.items[((this.rotationIndex % this.items.length) + this.items.length) % this.items.length]?.id;
        this.render();
    }

    initScrollListener() {
        this.sceneEl.addEventListener('scroll', () => {
            if (window.innerWidth >= 768 || this.isUpdatingScroll) return;
            const cards = this.sceneEl.getElementsByClassName('card-item');
            if (!cards.length) return;
            
            const sceneCenter = this.sceneEl.scrollLeft + (this.sceneEl.offsetWidth / 2);
            let minDiff = Infinity;
            let activeIdx = 0;
            
            for (let i = 0; i < cards.length; i++) {
                const cardCenter = cards[i].offsetLeft + (cards[i].offsetWidth / 2);
                const diff = Math.abs(sceneCenter - cardCenter);
                if (diff < minDiff) { minDiff = diff; activeIdx = i; }
            }
            this.rotationIndex = activeIdx;
        });
    }
}