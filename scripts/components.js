nr.defineComponent({
    name: "app",
    template: `
        <div id="languageSelector"></div>
        <div id="mapSelector"></div>
        <hr>
        <div id="routeInput"></div>
        <hr>
        <div id="mapDisplay"></div>
    `,
    beforeCreate: function () {
        return { 
            useShadowRoot: false,
            mountConfig: {
                className: 'd-flex flex-column gap-3'
            }
        }
    },
    afterCreate: function () {
        nr.mount('languageSelector', '#languageSelector')
        nr.mount('mapSelector', '#mapSelector')
        nr.mount('routeInput', '#routeInput')
        nr.mount('mapDisplay', '#mapDisplay')
    }
})

nr.defineComponent({
    name: "languageSelector",
    template: `
        <div class="card-header d-flex w-100 justify-content-center"><i class="bi bi-globe2 fs-2"></i></div>
        <ul class="list-group list-group-flush"></ul>
    `,
    beforeCreate: function () {
        return { 
            useShadowRoot: false,
            mountConfig: {
                className: 'card'
            }
        }
    },
    afterCreate: function () {
        const lr = document.querySelector('#languageSelector ul')
        window.trolley.fileindex.languages.forEach((l) => {
            //lr.innerHTML += `<li class="list-group-item">${JSON.stringify(l)}</li>`
            const li = document.createElement('button')
            li.innerHTML = `<span>${l.name}</span> <span class="fw-bold">${l.code}</span>`
            li.className = 'list-group-item w-100 d-flex justify-content-between'
            li.addEventListener('click', () => {
                window.trolley.lang = l.code
                const mcl = nr.mountedComponents
                for (const s in mcl) {
                    if (mcl.hasOwnProperty(s)) {
                        nr.unmount(s);
                    }
                }
                nr.mount('app', '#app')
                console.log('Remounted #app!')
            })
            li.type = "button"
            li.querySelector('span:nth-of-type(2)').style.transform = 'scale(0.75)'
            if (l.code == window.trolley.lang) li.classList.add('active')
            lr.appendChild(li)
        })
    }
})
// <li class="list-group-item"></li>
nr.defineComponent({
    name: "mapSelector",
    template: `
        <div class="card-header d-flex w-100 justify-content-center"><i class="bi bi-map fs-2"></i></div>
        <ul class="list-group list-group-flush"></ul>
    `,
    beforeCreate: function () {
        return { 
            useShadowRoot: false,
            mountConfig: {
                className: 'card'
            }
        }
    },
    afterCreate: function () {
        const lr = document.querySelector('#mapSelector ul')
        window.trolley.fileindex.maps.forEach((m) => {
            //lr.innerHTML += `<li class="list-group-item">${JSON.stringify(l)}</li>`
            fetch(m.meta)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    const li = document.createElement('button')
                    const map = data.mapname.find(i => i.language === window.trolley.lang) || data.mapname.find(i => i.language === 'en_US')
                    if (!map) {
                        console.error(`Map with meta '${m.meta}' does not have map name for language ${window.trolley.lang} or en_US`)
                    }
                    const mapname = map.name
                    li.innerHTML = `<span>${mapname}</span> <span class="fw-bold">${data.country}/${data.city}</span>`
                    li.className = 'list-group-item w-100 d-flex justify-content-between'
                    li.addEventListener('click', () => {
                        fetch(m.file)
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error('Network response was not ok');
                                }
                                return response.json();
                            })
                            .then(mdata => {
                                window.trolley.map = mdata
                                nr.remount('#routeInput', 'routeInput')
                                nr.remount('#mapDisplay', 'mapDisplay')
                            })
                    })
                    li.type = "button"
                    li.querySelector('span:nth-of-type(2)').style.transform = 'scale(0.75)'
                    lr.appendChild(li)
                })
        })
    }
})

nr.defineComponent({
    name: "routeInput",
    template: `
        <input class="form-control mb-2" list="mapStationsDatalist" id="routeInputFrom" placeholder="Откуда?">
        <input class="form-control mb-2" list="mapStationsDatalist" id="routeInputTo" placeholder="Куда?">
        <datalist id="mapStationsDatalist"></datalist>
        <div style="margin-left: auto;" class="d-flex gap-2">
            <button id="routeInput-filters" class="btn btn-outline-secondary" disabled>Фильтры</button>
            <button id="routeInput-search" class="btn btn-primary">Найти путь</button>
        </div>

        <div id="routeInput-display"></div>
    `,
    beforeCreate: function () {
        return { 
            useShadowRoot: false,
            mountConfig: {
                className: 'd-flex flex-column w-100'
            }
        }
    },
    afterCreate: function () {
        if (!window.trolley.map) return
        const dl = document.getElementById('mapStationsDatalist')
        window.trolley.map.lines.forEach(l => {
            l.stations.forEach(s => {
                const dlo = document.createElement('option')
                dlo.value = `${l.name} (${l.id}) -> ${s.name}`
                dlo.setAttribute('trolley-data-id', s.id)
                dl.appendChild(dlo)
            })
        })
        document.getElementById('routeInput-search').addEventListener('click', () => {
            const i = {
                f: document.getElementById('routeInputFrom'),
                t:document.getElementById('routeInputTo')
            }
            
            const fromId = Array.from(dl.options).find(o => o.value === i.f.value).getAttribute('trolley-data-id')
            const toId = Array.from(dl.options).find(o => o.value === i.t.value).getAttribute('trolley-data-id')
            let out = 'Похоже, вы не правильно ввели путь.'
            if (toId && fromId) {
                out = `${fromId} -> ${toId}`
            }
            document.getElementById('routeInput-display').innerHTML = out
        })
    }
})

nr.defineComponent({
    name: "mapDisplay",
    template: `<div class="accordion" id="mapDisplay-accordion"></div>`,
    beforeCreate: function () { return { useShadowRoot: false } },
    afterCreate: function () {
        if (!window.trolley.map) return
        const cr = document.querySelector('#mapDisplay-accordion')
        window.trolley.map.lines.forEach((l, i) => {
            cr.innerHTML += `
                <div class="accordion-item">
                    <h2 class="accordion-header">
                        <button class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#mapDisplay-line${i}">${l.name} (${l.id})</button>
                    </h2>
                    <div id="mapDisplay-line${i}" class="accordion-collapse collapse">
                        ${l.stations.map((s) => {
                            return `
                                <div class="d-flex w-100 p-1 px-2">
                                    <i class="bi bi-geo"></i>
                                    <span>${s.name}</span>
                                    <span style="margin-left: auto;">${s.id}</span>
                                </div>
                            `
                        }).join('')}
                    </div>
                </div>
            `
        })
    }
})