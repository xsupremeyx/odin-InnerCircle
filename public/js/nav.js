document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('nav-toggle');
    const nav = toggle.closest('nav');
    toggle.addEventListener('click', () => {
        nav.classList.toggle('open');
    });
});