nr.defineComponent({
    name: "app",
    template: `
        <div id="languageSelector"></div>
        <div id="mapSelector"></div>
        <div id="mapDisplay"></div>
        <hr>
        <div id="routeInput"></div>
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
        nr.mount('mapDisplay', '#mapDisplay')
        nr.mount('routeInput', '#routeInput')
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
    afterCreate: async function () {
        const lr = document.querySelector('#languageSelector ul')
        
        window.trolley.fileindex.languages.forEach((l) => {
            const li = document.createElement('button')
            li.innerHTML = `<span>${l.name}</span> <span class="fw-bold">${l.code}</span>`
            li.className = 'list-group-item w-100 d-flex justify-content-between'
            li.addEventListener('click', () => {
                window.trolley.lang = l.code
                window.trolley.updateLocales()
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
                    if (window.trolley.mapmeta.mapid == data.mapid) li.classList.add('active')
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
                                window.trolley.mapmeta = data
                                nr.remount('#mapSelector', 'mapSelector')
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
        <div id="routeInput-form" class="d-flex flex-column">
            <div class="alert alert-info d-flex gap-2 mb-2">
                <i class="bi bi-info-circle"></i>
                <span id="routeInputSelectionNotice"></span>
            </div>
            <input class="form-control mb-2" list="mapStationsDatalist" id="routeInputFrom" disabled placeholder="---">
            <input class="form-control mb-2" list="mapStationsDatalist" id="routeInputTo" disabled placeholder="---">
            <div class="d-flex">
                <button id="routeInputClear" class="btn btn-outline-danger">---</button>
                <div style="margin-left: auto;" class="d-flex gap-2">
                    <button id="routeInputFilters" class="btn btn-outline-secondary" disabled>---</button>
                    <button id="routeInputRouteme" class="btn btn-primary">---</button>
                </div>
            </div>

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
    afterCreate: async function () {
        const roots = {
            inputFrom: document.querySelector('#routeInputFrom'),
            inputTo: document.querySelector('#routeInputTo'),
            filters: document.querySelector('#routeInputFilters'),
            routeme: document.querySelector('#routeInputRouteme'),
            clearRoute: document.querySelector('#routeInputClear'),
            routeSelectionNotice: document.querySelector('#routeInputSelectionNotice')
        }

        while (true) {
            if (window.trolley && window.trolley.locales && Object.keys(window.trolley.locales).length > 0) {
                console.info('[routeInput] Locales loaded')
                break
            }
            console.warn('[routeInput] Waiting for locales!')
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        roots.inputFrom.placeholder = window.trolley.locales.ROUTEINPUT_FROM
        roots.inputTo.placeholder = window.trolley.locales.ROUTEINPUT_TO
        roots.filters.textContent = window.trolley.locales.ROUTEINPUT_FILTERS_BUTTON
        roots.routeme.textContent = window.trolley.locales.ROUTEINPUT_ROUTEME_BUTTON
        roots.clearRoute.textContent = window.trolley.locales.ROUTEINPUT_CLEARROUTE_BUTTON
        roots.routeSelectionNotice.textContent = window.trolley.locales.ROUTEINPUT_SELECTION_NOTICE

        roots.clearRoute.addEventListener('click', async () => {
            roots.clearRoute.innerHTML = '<i class="bi bi-check-lg"></i>'

            roots.inputTo.value = ''
            roots.inputFrom.value = ''

            setTimeout(() => {
                roots.clearRoute.textContent = window.trolley.locales.ROUTEINPUT_CLEARROUTE_BUTTON
            }, 1000)
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
        let cr_pre = ''
        window.trolley.map.lines.forEach((l, i) => {
            cr_pre += `
                <div class="accordion-item">
                    <h2 class="accordion-header">
                        <button class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#mapDisplay-line${i}">${l.name} (${l.id})</button>
                    </h2>
                    <div id="mapDisplay-line${i}" class="accordion-collapse collapse">
                        <ul class="list-group list-group-flush">
                            ${l.stations.map((s) => {
                                return `
                                    <li class="list-group-item d-flex w-100 align-items-center">
                                        <i class="bi bi-geo-alt me-3"></i>
                                        <span>${s.name}</span>
                                        <div style="margin-left: auto;" class="d-flex gap-2 align-items-center">
                                            <span style="transform: scale(0.75)">${s.id}</span>
                                            <a class="btn btn-primary btn-sm" href="#routeInput-form" data-trolley-from="${s.id}"><i class="bi bi-crosshair"></i></a>
                                            <a class="btn btn-secondary btn-sm" href="#routeInput-form" data-trolley-to="${s.id}"><i class="bi bi-geo"></i></a>
                                        </div>
                                    </li>
                                `
                            }).join('')}
                        </ul>
                    </div>
                </div>
            `
        })
        cr.innerHTML = cr_pre
        cr_pre = null
        const roots = {
            inputFrom: document.querySelector('#routeInputFrom'),
            inputTo: document.querySelector('#routeInputTo')
        }
        document.querySelectorAll('[data-trolley-from]').forEach(e => {
            e.addEventListener('click', () => {
                roots.inputFrom.value = e.getAttribute('data-trolley-from')
            })
        })
        document.querySelectorAll('[data-trolley-to]').forEach(e => {
            e.addEventListener('click', () => {
                roots.inputTo.value = e.getAttribute('data-trolley-to')
            })
        })
    }
})