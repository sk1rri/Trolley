const trolleyInitFinished = new CustomEvent('trolley.init.finish')

window.trolley = {
    fileindex: {},
    lang: 'ru_RU'
}

fetch('/fileindex.json')
    .then(response => {
        if (!response.ok) {
        throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        window.trolley.fileindex = data;
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    })
    .finally(() => {
        document.dispatchEvent(trolleyInitFinished)
    })