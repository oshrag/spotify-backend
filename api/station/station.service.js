import { ObjectId } from 'mongodb'

import { logger } from '../../services/logger.service.js'
import { makeId } from '../../services/util.service.js'
import { dbService } from '../../services/db.service.js'
import { asyncLocalStorage } from '../../services/als.service.js'

const PAGE_SIZE = 3

export const stationService = {
    remove,
    query,
    getById,
    add,
    update,
    createLikedSongsStation
    // addCarMsg,
    // removeCarMsg,
}

async function query(filterBy = {}) {
    try {

       console.log('filterby:', filterBy)

        const criteria = _buildCriteria(filterBy)
        // const sort = _buildSort(filterBy)

        console.log('filterby:', filterBy)
        console.log('criteria:', criteria)

        const collection = await dbService.getCollection('station')
        var stationCursor = await collection.find(criteria)
        console.log('station.service query')
        //var stationCursor = await collection.find()


        // if (filterBy.pageIdx !== undefined) {
        //     stationCursor.skip(filterBy.pageIdx * PAGE_SIZE).limit(PAGE_SIZE)
        // }

        const stations = stationCursor.toArray()





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
        // console.log('station:', station)
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
    const stationToSave = { name: station.name, description: station.description, songs: station.songs , imgUrl : station.imgUrl}

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
    const stationToSave = { savedBy : station.savedBy }

    console.log('upadateSavedBy stationToSave:', stationToSave)


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
        const loggedInUser = asyncLocalStorage.getStore()
        const criteria = {
            "createdBy.id": ObjectId.createFromHexString(loggedInUser._id),
            type: "liked"
        }
        const userLikedSongs = await collection.findOne(criteria)
        if (!userLikedSongs) throw new Error("Not your liked songs station")
    } catch (error) {
        logger.error("Having issues with finding user liked songs", error)
        throw error
    }
}




// async function addCarMsg(carId, msg) {
//     try {
//         const criteria = { _id: ObjectId.createFromHexString(carId) }
//         msg.id = makeId()

//         const collection = await dbService.getCollection('car')
//         await collection.updateOne(criteria, { $push: { msgs: msg } })

//         return msg
//     } catch (err) {
//         logger.error(`cannot add car msg ${carId}`, err)
//         throw err
//     }
// }

// async function removeCarMsg(carId, msgId) {
//     try {
//         const criteria = { _id: ObjectId.createFromHexString(carId) }

//         const collection = await dbService.getCollection('car')
//         await collection.updateOne(criteria, { $pull: { msgs: { id: msgId } } })

//         return msgId
//     } catch (err) {
//         logger.error(`cannot add car msg ${carId}`, err)
//         throw err
//     }
// }



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

function _buildSort(filterBy) {
    if (!filterBy.sortField) return {}
    return { [filterBy.sortField]: filterBy.sortDir }
}

// {$or: [{vendor :{$regex:'b', $options:"i"}}, {'owner.fullname' :{$regex:'b', $options:"i"}}]}