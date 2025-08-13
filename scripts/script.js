let fired = false
document.addEventListener('trolley.init.finish', () => {
    if (fired) return
    fired = true

    window.trolley.updateLocales()
    document.querySelector('#app').innerHTML = ''
    nr.mount('app', '#app')
})