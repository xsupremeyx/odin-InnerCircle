(function () {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.classList.add(theme);
})();

function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    document.documentElement.classList.remove('dark', 'light');
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.classList.add(newTheme);
    localStorage.setItem('theme', newTheme);
    updateIcon(newTheme === 'dark');
}

function updateIcon(isDark) {
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = isDark ? '🌙' : '☀️';
}

document.addEventListener('DOMContentLoaded', () => {
    const isDark = document.documentElement.classList.contains('dark');
    updateIcon(isDark);
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
});