import { Socket } from 'socket.io'
import { logger } from '../../services/logger.service.js'
import { youtubeService } from './youtube.service.js'
import { userService } from '../user/user.service.js'
import { asyncLocalStorage } from '../../services/als.service.js'
import { ObjectId } from 'mongodb'
import { socketService } from '../../services/socket.service.js'

export async function getYoutubeSongs(req, res) {
	const { location, userId, userInput } = req.query
	try {
		// const filterBy = { location, userId, userInput }
		const songs = await youtubeService.query(userInput, location)

		res.json(songs)
	} catch (err) {
		logger.error('Failed to get songs from YOUTUBE', err)
		res.status(400).send({ err: 'Failed to get songs from YOUTUBE' })
	}
}
