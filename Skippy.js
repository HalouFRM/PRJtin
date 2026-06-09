export class Skippy {
    constructor() {
        this.bubble = document.getElementById('skippyBubble');
        this.wrapper = document.getElementById('skippyWrapper');
        this.timeoutId = null;
        this.quotes = [
            "Bum-bum-bi-dum! Z tej strony Skippy!",
            "Tryb „Bezwzględny Morderca” aktywowany pomyślnie. Kogo sprzątnąć, V?",
            "Ej! Przestań zamulać i wybierz prezent, od tego czekania topią mi się styki!",
            "Mam wbudowaną ochronę przed idiotami. Ale wobec twoich życzeń jestem bezsilny!",
            "Hej, czumba! Nie zapomnij wylogować się z terminala, jak skończysz.",
            "Tra-la-la! Zaśpiewać ci piosenkę? Hm-mmm-hm-mmm..."
        ];
        this.init();
    }

    init() {
        if (this.wrapper) {
            this.wrapper.addEventListener('click', () => {
                const randomQuote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
                this.talk(randomQuote);
            });
        }
    }

    talk(text, isAlert = false) {
        if (!this.bubble) return;
        if (this.timeoutId) clearTimeout(this.timeoutId);

        this.bubble.innerText = text;
        this.bubble.classList.toggle('alert', isAlert);
        this.bubble.classList.add('show');
        
        this.timeoutId = setTimeout(() => { 
            this.bubble.classList.remove('show'); 
        }, 6500);
    }
}