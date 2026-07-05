const translations = {
    ru: {
        title: 'Быстрые и <span class="text-yellow">короткие</span> ссылки',
        sub: 'Мгновенное сокращение ссылок, стабильный редирект',
        placeholder: 'Вставьте ссылку',
        btn_submit: 'Сократить ссылку',
        btn_copy: 'Копировать',
        toast_text: 'Успешно скопировано!'
    },
    en: {
        title: 'Fast and <span class="text-yellow">short</span> links',
        sub: 'Instant link shortening, stable redirect',
        placeholder: 'Paste a link',
        btn_submit: 'Shorten link',
        btn_copy: 'Copy',
        toast_text: 'Successfully copied!'
    }
};

let currentLang = localStorage.getItem('anke_links_lang') || 'ru';
let toastTimeout;
let fullUrlToCopy = '';

function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('anke_links_lang', lang);
    document.documentElement.lang = lang;

    document.getElementById('title-text').innerHTML = translations[lang].title;
    document.getElementById('sub-text').innerHTML = translations[lang].sub;
    document.getElementById('urlInput').placeholder = translations[lang].placeholder;
    document.getElementById('btn-submit').textContent = translations[lang].btn_submit;
    document.getElementById('copyBtn').textContent = translations[lang].btn_copy;
    document.getElementById('toast-text').textContent = translations[lang].toast_text;

    document.getElementById('lang-menu').classList.remove('show');
}

function toggleLangMenu(e) {
    e.stopPropagation();
    document.getElementById('lang-menu').classList.toggle('show');
}

document.addEventListener('click', () => {
    document.getElementById('lang-menu').classList.remove('show');
});

document.getElementById('urlForm').onsubmit = async (e) => {
    e.preventDefault();
    try {
        let res = await fetch('/shorten', {method: 'POST', body: new FormData(e.target)});
        if (!res.ok) throw new Error();
        let data = await res.json();

        fullUrlToCopy = data.copy_url;

        document.getElementById('shortUrl').textContent = data.display_url;
        document.getElementById('result').classList.remove('hide');
    } catch (err) {
        alert(currentLang === 'ru' ? 'Ошибка при отправке' : 'Request error');
    }
};

document.getElementById('copyBtn').onclick = function () {
    navigator.clipboard.writeText(fullUrlToCopy);

    const toast = document.getElementById('notification-toast');
    toast.className = 'toast-show';

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.className = 'toast-hide';
    }, 2500);
};

document.addEventListener('DOMContentLoaded', () => {
    setLang(currentLang);
});