window.routeMe = function (map, from, to) {
	const graph = new Map()
	const nameToIds = new Map()
	const idToStation = new Map()

	map.lines.forEach(line => {
		line.stations.forEach(station => {
			if (station.type === "station") {
				graph.set(station.id, {
					name: station.name,
					connections: [],
					line: line.name
				})
				idToStation.set(station.id, station)
				if (station.name) {
					if (!nameToIds.has(station.name)) nameToIds.set(station.name, [])
					nameToIds.get(station.name).push(station.id)
				}
			}
		})
	})

	map.merges.forEach(merge => {
		const connections = merge.connections
		for (let i = 0; i < connections.length; i += 2) {
			const stationA = connections[i]
			const stationB = connections[i + 1]
			if (graph.has(stationA) && graph.has(stationB)) {
				graph.get(stationA).connections.push({ id: stationB, type: merge.in, by: "mapMerge" })
				graph.get(stationB).connections.push({ id: stationA, type: merge.in, by: "mapMerge" })
			}
		}
	})

	map.lines.forEach(line => {
		const stations = line.stations.map(station => station.id)
		for (let i = 0; i < stations.length - 1; i++) {
			graph.get(stations[i]).connections.push({ id: stations[i + 1], type: "inside" })
			graph.get(stations[i + 1]).connections.push({ id: stations[i], type: "inside" })
		}
	})

	nameToIds.forEach(ids => {
		if (ids.length > 1) {
			for (let i = 0; i < ids.length; i++) {
				for (let j = i + 1; j < ids.length; j++) {
					const idA = ids[i]
					const idB = ids[j]
					const stationA = idToStation.get(idA)
					const stationB = idToStation.get(idB)
					if (!(stationA.ff && stationA.ff.noAutoMerge) && !(stationB.ff && stationB.ff.noAutoMerge)) {
						graph.get(idA).connections.push({ id: idB, type: "inside", by: "autoMerge" })
						graph.get(idB).connections.push({ id: idA, type: "inside", by: "autoMerge" })
					}
				}
			}
		}
	})

	const queue = [from]
	const visited = new Set()
	const parent = { [from]: null }

	while (queue.length > 0) {
		const current = queue.shift()

		if (current === to) {
			const path = []
			let step = to

			while (step) {
				path.unshift(step)
				step = parent[step]
			}

			const output = []
			for (let i = 0; i < path.length; i++) {
				const stationId = path[i]
				const station = graph.get(stationId)
				output.push({ type: "station", id: stationId })

				if (i < path.length - 1) {
					const nextStationId = path[i + 1]
					const nextStation = graph.get(nextStationId)
					const connectionType = station.connections.find(conn => conn.id === nextStationId).type

					if (station.line !== nextStation.line) {
						output.push({ type: "switch", in: connectionType, by: station.connections.find(conn => conn.id === nextStationId).by })
					}
				}
			}
			return output
		}

		visited.add(current)

		for (const connection of graph.get(current).connections) {
			const neighbor = connection.id
			if (!visited.has(neighbor) && !queue.includes(neighbor)) {
				queue.push(neighbor);
				parent[neighbor] = current
			}
		}
	}

	return null
}

let fired = false
document.addEventListener('trolley.init.finish', () => {
    if (fired) return
    fired = true

    window.trolley.updateLocales()
    document.querySelector('#app').innerHTML = ''
    nr.mount('app', '#app')
})