nr.defineComponent({
    name: "app",
    template: `
        <div id="languageSelector"></div>
        <div id="mapSelector"></div>
        <hr>
        <div id="mapDisplay"></div>
        <div id="routeInput"></div>
        <div id="filtersModal"></div>
    `,
    beforeCreate: function () {
        return { 
            useShadowRoot: false,
            mountConfig: {
                className: 'd-flex flex-column'
            }
        }
    },
    afterCreate: function () {
        nr.mount('filtersModal', '#filtersModal')
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
                className: 'card mb-3'
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
                        nr.unmount(s)
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
                className: 'card mb-1'
            }
        }
    },
    afterCreate: function () {
        const lr = document.querySelector('#mapSelector ul')
        window.trolley.fileindex.maps.forEach((m) => {
            fetch(m.meta)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok')
                    }
                    return response.json()
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
                                    throw new Error('Network response was not ok')
                                }
                                return response.json()
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
                .finally(() => {
                    document.querySelector('#mapSelector ul button:nth-of-type(1)').classList.contains('active') ? null : document.querySelector('#mapSelector ul button:nth-of-type(1)').click()
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
            <div id="routeInputDisplay" class="card d-flex justify-content-between flex-row mb-2 p-1 px-4 overflow-hidden">
                <div id="routeInputDisplayGradient"></div>
                <span id="routeInputFrom">---</span>
                <span id="routeInputTo">---</span>
            </div>
            <div class="d-flex mb-2">
                <button id="routeInputClear" class="btn btn-outline-danger">---</button>
                <div style="margin-left: auto" class="d-flex gap-2">
                    <button id="routeInputFilters" class="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#exampleModal">---</button>
                    <a id="routeInputRouteme" class="btn btn-primary" href="#routeInputRouteDisplay">---</a>
                </div>
            </div>

        </div>
        <ol id="routeInputRouteDisplay"></ol>
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
        while (true) {
            if (window.trolley && window.trolley.locales && Object.keys(window.trolley.locales).length > 0) {
                console.info('[routeInput] Locales loaded')
                break
            }
            console.warn('[routeInput] Waiting for locales!')
            await new Promise(resolve => setTimeout(resolve, 100))
        }

        document.getElementById('routeInputFrom').textContent = window.trolley.locales.ROUTEINPUT_FROM
        document.getElementById('routeInputTo').textContent = window.trolley.locales.ROUTEINPUT_TO
        document.getElementById('routeInputFilters').textContent = window.trolley.locales.ROUTEINPUT_FILTERS_BUTTON
        document.getElementById('routeInputRouteme').textContent = window.trolley.locales.ROUTEINPUT_ROUTEME_BUTTON
        document.getElementById('routeInputClear').textContent = window.trolley.locales.ROUTEINPUT_CLEARROUTE_BUTTON
        document.getElementById('routeInputSelectionNotice').textContent = window.trolley.locales.ROUTEINPUT_SELECTION_NOTICE
        // YEAH I KNOW this is meant to only work for itself but do i look like i want to re-check if we have the locales or not?
        // i will rewrite the thing anyways so itll be way more efficient than this is, so just ignore, or better suggest me how to make a service to translate this page
        document.getElementById('filtersModalTitle').textContent = window.trolley.locales.ROUTEINPUT_FILTERS_BUTTON
        // go on, blame me for this. they literally have the same value, why should i make a 2nd option, same key?
        document.getElementById('filtersModalSave').textContent = window.trolley.locales.FILTERS_SAVE_BUTTON
        document.getElementById('filtersModalCancel').textContent = window.trolley.locales.FILTERS_CANCEL_BUTTON
        document.getElementById('filtersModalAlert').textContent = window.trolley.locales.FILTERS_ALERT
        document.querySelector('label[for="filtersModal_noSurfaceSwitches"]').textContent = window.trolley.locales.FILTERS_DISABLE_SURFACESWITCHES

        document.getElementById('routeInputClear').addEventListener('click', async () => {
            const clearRouteButton = document.getElementById('routeInputClear')
            clearRouteButton.innerHTML = '<i class="bi bi-check-lg"></i>'

            document.getElementById('routeInputFrom').textContent = window.trolley.locales.ROUTEINPUT_FROM
            document.getElementById('routeInputTo').textContent = window.trolley.locales.ROUTEINPUT_TO
            document.getElementById('routeInputDisplayGradient').style.setProperty('--col1', 'gray')
            document.getElementById('routeInputDisplayGradient').style.setProperty('--col2', 'gray')
            document.getElementById('routeInputRouteDisplay').innerHTML = ''
            setTimeout(() => {
                clearRouteButton.textContent = window.trolley.locales.ROUTEINPUT_CLEARROUTE_BUTTON
            }, 1000)
        })

        document.getElementById('routeInputRouteme').addEventListener('click', () => {
            let mapFilterred = window.trolley.map
            if (localStorage.getItem('filters_disableSurfaceSwitches') === 'true') mapFilterred.merges = mapFilterred.merges.filter(merge => merge.in !== 'surface')
            
            let route
            try {
                route = window.routeMe(mapFilterred, 
                    document.getElementById('routeInputFrom').textContent, 
                    document.getElementById('routeInputTo').textContent)
            } catch (e) {
                route = 'We have fucked up1!1'
            }
            const didWeFuckUp = typeof route == 'string' || route == null || route.length == 0

            const r = document.getElementById('routeInputRouteDisplay')
            if (didWeFuckUp) {
                r.innerHTML = `<div class="alert alert-danger">${window.trolley.locales.ROUTE_FUCKEDUP}</div>`
            } else {
                r.innerHTML = ''
                route.forEach(dest => {
                    l = document.createElement('li')
                    l.textContent = JSON.stringify(dest)
                    switch (dest.type) {
                        case 'station':
                            l.innerHTML = `<i class="bi bi-geo-alt-fill"></i> ${mapFilterred.lines.flatMap(line => line.stations).find(station => station.id === dest.id).name} (${dest.id})`
                            l.style.setProperty('--col', `#${mapFilterred.lines.find(line => line.stations.some(station => station.id === dest.id)).color}`)
                            break
                        case 'switch':
                            l.classList.add('my-1')
                            if (dest.in == 'surface') {
                                l.innerHTML = `<i class="bi bi-person-walking"></i> ${window.trolley.locales.ROUTE_SWITCH_SURFACE}`
                                l.style.setProperty('--style', 'dotted')
                            } else {
                                l.innerHTML = `<i class="bi bi-person-walking"></i> ${window.trolley.locales.ROUTE_SWITCH_INSIDE}`
                            }
                            break
                    }
                    r.appendChild(l)
                })
            }
        })
    }
})
nr.defineComponent({
    name: "mapDisplay",
    template: ` `,
    beforeCreate: function () {
        return { 
            useShadowRoot: false,
            mountConfig: {
                className: 'accordion mt-1 mb-2',
                id: "mapDisplay-accordion"
            }
        }
    },
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
                                        <div style="margin-left: auto" class="d-flex gap-2 align-items-center">
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
        document.querySelectorAll('[data-trolley-from]').forEach(e => {
            e.addEventListener('click', () => {
                document.querySelector('#routeInputFrom').textContent = e.getAttribute('data-trolley-from')
                document.getElementById('routeInputDisplayGradient').style.setProperty('--col1', `#${window.trolley.map.lines.find(line => line.stations.some(s => s.id === e.getAttribute('data-trolley-from')))?.color}`)
            })
        })
        document.querySelectorAll('[data-trolley-to]').forEach(e => {
            e.addEventListener('click', () => {
                document.querySelector('#routeInputTo').textContent = e.getAttribute('data-trolley-to')
                document.getElementById('routeInputDisplayGradient').style.setProperty('--col2', `#${window.trolley.map.lines.find(line => line.stations.some(s => s.id === e.getAttribute('data-trolley-to')))?.color}`)
            })
        })
    }
})

nr.defineComponent({
    name: 'filtersModal',
    //                              vvvvvvvvvvvv For some reason, when i change it from exampleModal to filtersModal, it trips all over and fails to open the modal. why? i dont know, doesnt drop any errors in the console.
    template: `
        <div class="modal fade" id="exampleModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h1 id="filtersModalTitle" class="modal-title fs-5">---</h1>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-danger" id="filtersModalAlert">---</div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" value="" id="filtersModal_noSurfaceSwitches">
                            <label class="form-check-label" for="filtersModal_noSurfaceSwitches">---</label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="filtersModalCancel" type="button" class="btn btn-secondary" data-bs-dismiss="modal">---</button>
                        <button id="filtersModalSave" type="button" class="btn btn-primary" data-bs-dismiss="modal">---</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    beforeCreate: () => { return { useShadowRoot: false } },
    afterCreate: () => {
        document.getElementById('filtersModal_noSurfaceSwitches').checked = localStorage.getItem('filters_disableSurfaceSwitches') === 'true'
        document.getElementById('filtersModalSave').addEventListener('click', () => {
            localStorage.setItem('filters_disableSurfaceSwitches', document.getElementById('filtersModal_noSurfaceSwitches').checked)
        })
        document.getElementById('filtersModalCancel').addEventListener('click', () => {
            document.getElementById('filtersModal_noSurfaceSwitches').checked = localStorage.getItem('filters_disableSurfaceSwitches') === 'true'
        })
    }
})