(() => {
const desktop = matchMedia('(min-width: 601px)');
const windows = [...document.querySelectorAll('.desktop-window')];
const positions = new Map(windows.map(win => [win, { x: 0, y: 0 }]));
let topLayer = 1;
let drag = null;
const minimized = new Set();
const closed = new Set(windows.filter(win => win.classList.contains('closed')));
const maximized = new Set();
const taskbar = document.querySelector('.taskbar');
const tabs = document.querySelector('.taskbar-tabs');
const windowTabs = new Map();
function syncTaskbar() {
    taskbar.hidden = minimized.size === 0;
    document.body.classList.toggle('has-minimized', minimized.size > 0);
}
function restore(win, focus = true) {
    minimized.delete(win);
    win.classList.remove('minimized');
    win.inert = false;
    windowTabs.get(win)?.remove();
    windowTabs.delete(win);
    win.style.zIndex = String(++topLayer);
    syncTaskbar();
    if (focus) {
        win.querySelector('.window-bar').focus({ preventScroll: true });
        win.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    }
}
function toggleMaximize(win) {
    finish();
    const button = win.querySelector('.maximize-window');
    const expanding = !maximized.has(win);
    if (expanding) maximized.add(win); else maximized.delete(win);
    win.classList.toggle('maximized', expanding);
    win.style.zIndex = String(++topLayer);
    button.textContent = expanding ? '❐' : '□';
    button.title = expanding ? 'Restore size' : 'Maximize';
    button.setAttribute('aria-label', button.title + ' ' + win.dataset.title);
    button.setAttribute('aria-pressed', String(expanding));
}
function closeWindow(win) {
    finish();
    closed.add(win);
    win.classList.add('closed');
    win.inert = true;
    document.querySelector('[data-open="' + win.id + '"]').focus();
}
function minimize(win) {
    if (minimized.has(win)) return;
    finish();
    minimized.add(win);
    win.classList.add('minimized');
    win.inert = true;
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'taskbar-tab';
    tab.textContent = '▣ ' + win.dataset.title;
    tab.setAttribute('aria-label', 'Restore ' + win.dataset.title);
    tab.setAttribute('aria-controls', win.id);
    tab.addEventListener('click', () => restore(win));
    tabs.append(tab);
    windowTabs.set(win, tab);
    syncTaskbar();
    tab.focus();
}
function move(win, x, y) {
    const position = positions.get(win);
    const rect = win.getBoundingClientRect();
    const baseLeft = rect.left - position.x;
    const baseTop = rect.top + scrollY - position.y;
    position.x = Math.max(8 - baseLeft, Math.min(x, document.documentElement.clientWidth - rect.width - 8 - baseLeft));
    position.y = Math.max(8 - baseTop, Math.min(y, 220));
    win.style.transform = `translate(${position.x}px, ${position.y}px)`;
}
function finish() {
    if (!drag) return;
    const { win, bar, pointerId } = drag;
    drag = null;
    win.classList.remove('dragging');
    if (bar.hasPointerCapture(pointerId)) bar.releasePointerCapture(pointerId);
}
function reset() {
    finish();
    for (const win of windows) {
        if (minimized.has(win)) restore(win, false);
        if (maximized.has(win)) toggleMaximize(win);
        closed.delete(win);
        win.classList.remove('closed');
        win.inert = false;
        positions.set(win, { x: 0, y: 0 });
        win.style.transform = '';
        win.style.zIndex = '';
    }
    topLayer = 1;
}
for (const win of windows) {
    const bar = win.querySelector('.window-bar');
    win.querySelector('.minimize-window').addEventListener('click', () => minimize(win));
    win.querySelector('.close-window').addEventListener('click', () => closeWindow(win));
    const hint = document.createElement('span');
    hint.className = 'drag-hint';
    hint.textContent = 'drag to move';
    hint.setAttribute('aria-hidden', 'true');
    bar.insertBefore(hint, bar.lastElementChild);
    bar.addEventListener('pointerdown', event => {
        if (maximized.has(win) || !desktop.matches || event.button !== 0 || event.target.closest('button')) return;
        finish();
        const position = positions.get(win);
        drag = { win, bar, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: position.x, y: position.y };
        win.style.zIndex = String(++topLayer);
        win.classList.add('dragging');
        bar.setPointerCapture(event.pointerId);
        bar.focus({ preventScroll: true });
        event.preventDefault();
    });
    bar.addEventListener('pointermove', event => {
        if (!drag || drag.bar !== bar || drag.pointerId !== event.pointerId) return;
        move(win, drag.x + event.clientX - drag.startX, drag.y + event.clientY - drag.startY);
    });
    bar.addEventListener('pointerup', finish);
    bar.addEventListener('pointercancel', finish);
    bar.addEventListener('lostpointercapture', finish);
    bar.addEventListener('keydown', event => {
        if (maximized.has(win) || !desktop.matches || event.target !== bar) return;
        const delta = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] }[event.key];
        if (event.key === 'Home') {
            event.preventDefault();
            move(win, 0, 0);
        } else if (delta) {
            event.preventDefault();
            const position = positions.get(win);
            win.style.zIndex = String(++topLayer);
            move(win, position.x + delta[0], position.y + delta[1]);
        }
    });
}
for (const icon of document.querySelectorAll('[data-open]')) {
    icon.addEventListener('click', () => {
        const win = document.getElementById(icon.dataset.open);
        closed.delete(win);
        win.classList.remove('closed');
        restore(win);
    });
}
window.addEventListener('resize', () => {
    finish();
    for (const win of windows) {
        positions.set(win, { x: 0, y: 0 });
        win.style.transform = '';
    }
});

})();
