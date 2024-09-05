import { logger } from '../../services/logger.service.js'
import { stationService } from './station.service.js'

export async function getStations(req, res) {
	const { location, userId, userInput } = req.query
	try {
		const filterBy = { location, userId, userInput }
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

export async function getUserLikedSongs(req, res) {
	try {
		const userLikedSongs = await stationService.getUserLikedSongs()
		res.json(userLikedSongs)
	} catch (error) {
		logger.error('Failed to get user liked songs', error)
		res.status(400).send({ err: 'Failed to get user liked songs' })
	}
}

export async function addStation(req, res) {
	const { loggedInUser, body: station } = req
	try {
		const { _id, ...logeddinUserCopy } = loggedInUser;
		station.createdBy = { ...logeddinUserCopy, id: _id };
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

	if (!isAdmin && station.createdBy.id !== userId) {
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

export async function updateStationSavedBy(req, res) {
	const { loggedInUser, body: station } = req

	try {
		const updatedStation = await stationService.updateSavedBy(station)
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