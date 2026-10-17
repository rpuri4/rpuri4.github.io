(() => {
const copy = document.createElement('button');
copy.className = 'copy-email';
copy.type = 'button';
copy.textContent = 'copy email';
const status = document.createElement('span');
status.className = 'copy-status';
status.setAttribute('role', 'status');
let reset;
copy.addEventListener('click', async () => {
    clearTimeout(reset);
    try {
        await navigator.clipboard.writeText('rianpuri01@gmail.com');
        copy.textContent = 'copied!';
        status.textContent = 'Email address copied to clipboard.';
    } catch {
        copy.textContent = 'rianpuri01@gmail.com';
        status.textContent = 'Copy unavailable. Email address: rianpuri01@gmail.com';
    }
    reset = setTimeout(() => { copy.textContent = 'copy email'; status.textContent = ''; }, 4000);
});
document.querySelector('#sidebar').append(copy, status);

})();
