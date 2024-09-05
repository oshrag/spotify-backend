import express from 'express'

import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { log } from '../../middlewares/logger.middleware.js'

// import { getCars, getCarById, addCar, updateCar, removeCar, addCarMsg, removeCarMsg } from './car.controller.js'
import { getStations, addStation, removeStation, getStationById, updateStation,  getUserLikedSongs, updateStationSavedBy } from './station.controller.js'

const router = express.Router()

// We can add a middleware for the entire router:
// router.use(requireAuth)

router.get('/', getStations)
router.get('/:id', log, getStationById)
router.get('/user-liked-songs', requireAuth, getUserLikedSongs)
router.post('/', log, requireAuth, addStation)
router.put('/', requireAuth, updateStation)
router.put('/savedby', requireAuth, updateStationSavedBy)

router.delete('/:id', requireAuth, removeStation)
// router.delete('/:id', requireAuth, requireAdmin, removeCar)

// router.post('/:id/msg', requireAuth, addCarMsg)
// router.delete('/:id/msg/:msgId', requireAuth, removeCarMsg)

export const stationRoutes = router