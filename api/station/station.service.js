import { ObjectId } from 'mongodb'
import { logger } from '../../services/logger.service.js'
import { dbService } from '../../services/db.service.js'
import { asyncLocalStorage } from '../../services/als.service.js'

export const stationService = {
    remove,
    query,
    getById,
    add,
    update,
    updateSavedBy,
    createLikedSongsStation,
    getUserLikedSongs
}

async function query(filterBy = {}) {
    try {
        const criteria = _buildCriteria(filterBy)
        const collection = await dbService.getCollection('station')
        const stations = await collection.find(criteria).toArray()

        return stations
    } catch (err) {
        logger.error('cannot find stations', err)
        throw err
    }
}

async function getById(stationId) {
    try {
        const criteria = { _id: ObjectId.createFromHexString(stationId) }

        const collection = await dbService.getCollection('station')
        const station = await collection.findOne(criteria)
        if (!station) throw new Error(`Cannot get station with _id ${stationId}`)
        station.createdAt = station._id.getTimestamp()
        return station
    } catch (err) {
        logger.error(`while finding station ${stationId}`, err)
        throw err
    }
}

async function remove(stationId) {
    const { loggedInUser } = asyncLocalStorage.getStore()
    const { _id: ownerId, isAdmin } = loggedInUser


    try {
        const criteria = {
            _id: ObjectId.createFromHexString(stationId),
        }
        if (!isAdmin) criteria['createdBy.id'] = ownerId

        const collection = await dbService.getCollection('station')
        const res = await collection.deleteOne(criteria)

        if (res.deletedCount === 0) throw ('Not your station')
        return stationId
    } catch (err) {
        logger.error(`cannot remove station ${stationId}`, err)
        throw err
    }
}

async function add(station) {
    try {
        const collection = await dbService.getCollection('station')
        await collection.insertOne(station)

        return station
    } catch (err) {
        logger.error('cannot insert station', err)
        throw err
    }
}

async function update(station) {
    const stationToSave = { name: station.name, description: station.description, songs: station.songs, imgUrl: station.imgUrl }

    try {
        const criteria = { _id: ObjectId.createFromHexString(station._id) }

        const collection = await dbService.getCollection('station')
        await collection.updateOne(criteria, { $set: stationToSave })

        return station
    } catch (err) {
        logger.error(`cannot update station ${station._id}`, err)
        throw err
    }
}

async function updateSavedBy(station) {
    const stationToSave = { savedBy: station.savedBy }

    try {
        const criteria = { _id: ObjectId.createFromHexString(station._id) }

        const collection = await dbService.getCollection('station')
        await collection.updateOne(criteria, { $set: stationToSave })

        return station
    } catch (err) {
        logger.error(`cannot update station ${station._id}`, err)
        throw err
    }
}

function createLikedSongsStation(miniUser) {
    miniUser.id = miniUser.id.toString()
    const newStation = {
        name: "Liked Songs",
        type: "liked",
        description: '',
        imgUrl: 'https://misc.scdn.co/liked-songs/liked-songs-300.png',
        tags: [],
        createdBy: miniUser,
        savedBy: [],
        songs: []
    }

    return add(newStation);
}

async function getUserLikedSongs() {
    try {
        const collection = await dbService.getCollection('station')
        const { loggedInUser } = asyncLocalStorage.getStore()
        const criteria = { "createdBy.id": loggedInUser._id, type: "liked" }
        const userLikedSongs = await collection.findOne(criteria)

        if (!userLikedSongs) throw new Error("Not your liked songs station")
        return userLikedSongs
    } catch (error) {
        logger.error("Having issues with finding user liked songs", error)
        throw error
    }
}

function _buildCriteria(filterBy) {
    const { location, userId, userInput } = filterBy
    const criteria = {}

    if (location === "library" && userId) {
        criteria.$or = [{ "createdBy.id": userId }, { savedBy: userId }]
    }
    if (location === "home" && userId) {
        criteria.$nor = [{ "createdBy.id": userId }, { type: "liked" }]
    }
    if (location === "home" && !userId) {
        criteria.type = { $ne: "liked" };
    }
    if (location === "search" && userInput) {
        criteria.tags = { $elemMatch: { $regex: `^${userInput}$`, $options: 'i' } }
    }
    return criteria
}