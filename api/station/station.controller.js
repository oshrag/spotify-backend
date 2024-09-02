import { logger } from '../../services/logger.service.js'
import { stationService } from './station.service.js'

export async function getStations(req, res) {
	console.log('station.controller getStations')
	try {
		const filterBy = {
			createdBy : req.query.createdBy || '',
			notCreatedBy : req.query.notCreatedBy || '',
			// txt: req.query.txt || '',
			// minSpeed: +req.query.minSpeed || 0,
            // sortField: req.query.sortField || '',
            // sortDir: req.query.sortDir || 1,
			// pageIdx: req.query.pageIdx,
		}
		const stations = await stationService.query(filterBy)
        
		res.json(stations)
	} catch (err) {
		logger.error('Failed to get stationss', err)
		res.status(400).send({ err: 'Failed to get stations' })
	}
}

export async function getStationById(req, res) {
	try {
		const stationId = req.params.id
		const station = await stationService.getById(stationId)
		res.json(station)
	} catch (err) {
		logger.error('Failed to get station', err)
		res.status(400).send({ err: 'Failed to get station' })
	}
}

export async function addStation(req, res) {
	const { loggedInUser, body: station } = req
    console.log('station:', station)
	try {
		
        
		const logeddinUserCopy = { ...loggedInUser }
        delete logeddinUserCopy._id;
		station.createdBy = logeddinUserCopy
		station.createdBy.id = loggedInUser._id



		const addedStation = await stationService.add(station)
		res.json(addedStation)
	} catch (err) {
		logger.error('Failed to add station', err)
		res.status(400).send({ err: 'Failed to add station' })
	}
}

export async function updateStation(req, res) {
	const { loggedInUser, body: station } = req
    const { _id: userId, isAdmin } = loggedInUser

     if(!isAdmin && station.createdBy.id !== userId) {

        res.status(403).send('Not your station...')
        return
    }

	try {
		const updatedStation = await stationService.update(station)
		res.json(updatedStation)
	} catch (err) {
		logger.error('Failed to update station', err)
		res.status(400).send({ err: 'Failed to update station' })
	}
}

export async function removeStation(req, res) {
	try {
		const stationId = req.params.id
		const removedId = await stationService.remove(stationId)

		res.send(removedId)
	} catch (err) {
		logger.error('Failed to remove station', err)
		res.status(400).send({ err: 'Failed to remove station' })
	}
}

// export async function addCarMsg(req, res) {
// 	const { loggedinUser } = req

// 	try {
// 		const carId = req.params.id
// 		const msg = {
// 			txt: req.body.txt,
// 			by: loggedinUser,
// 		}
// 		const savedMsg = await carService.addCarMsg(carId, msg)
// 		res.json(savedMsg)
// 	} catch (err) {
// 		logger.error('Failed to update car', err)
// 		res.status(400).send({ err: 'Failed to update car' })
// 	}
// }

// export async function removeCarMsg(req, res) {
// 	try {
// 		const carId = req.params.id
// 		const { msgId } = req.params

// 		const removedId = await carService.removeCarMsg(carId, msgId)
// 		res.send(removedId)
// 	} catch (err) {
// 		logger.error('Failed to remove car msg', err)
// 		res.status(400).send({ err: 'Failed to remove car msg' })
// 	}
// }
