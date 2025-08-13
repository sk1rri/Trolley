const trolleyInitFinished = new CustomEvent('trolley.init.finish')

window.trolley = {
    fileindex: {},
    lang: 'ru_RU',
    locales: {},
    mapmeta: {},
    updateLocales: function () {
        window.trolley.locales = {}
        const map = window.trolley.fileindex.languages.find(i => i.code === window.trolley.lang)
        if (!map) throw new Error('Invalid locale selected')
        fetch(map.file)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok')
                }
                return response.json()
            })
            .then(data => {
                window.trolley.locales = data
            })
        console.info(`Updated locales for ${window.trolley.lang}`)
    }
}

fetch('fileindex.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok')
        }
        return response.json()
    })
    .then(data => {
        window.trolley.fileindex = data
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error)
    })
    .finally(() => {
        document.dispatchEvent(trolleyInitFinished)
    })