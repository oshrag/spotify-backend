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
    createLikedSongsStation,
    updateSavedBy
    // addCarMsg,
    // removeCarMsg,
}

async function query(filterBy = { txt: '' }) {
    try {

      

        const criteria = _buildCriteria(filterBy)
        // const sort = _buildSort(filterBy)

        // console.log('filterby:', filterBy)
        // console.log('criteria:', criteria)

        const collection = await dbService.getCollection('station')
        var stationCursor = await collection.find(criteria)
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
    const stationToSave = { name: station.name, description: station.description, songs: station.songs , imgUrl : station.imgUrl, savedBy : station.savedBy}

    console.log('upadate stationToSave:', stationToSave)


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
    const newStation =  {
        name: "Liked Songs",
        type: "liked",
        description: null,
        imgUrl: 'https://www.greencode.co.il/wp-content/uploads/2024/07/station-thumb-default.jpg',
        tags: [],
        createdBy: miniUser,
        savedBy: [],
        songs: []
    }

    add(newStation);
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

    if (filterBy.createdBy) {
        const criteria = {
            $or: [
                { 'createdBy.id': filterBy.createdBy },
                { 'savedBy': { $in: [filterBy.createdBy] } }
            ]
        }
        return criteria
    } else if (filterBy.notCreatedBy) {
        const criteria = {
            $nor: [
                { 'createdBy.id': filterBy.notCreatedBy }, 
                { 'savedBy': { $in: [filterBy.notCreatedBy] } } 
            ]
        }
        return criteria
    } else {
        return {}
    }


}

function _buildSort(filterBy) {
    if (!filterBy.sortField) return {}
    return { [filterBy.sortField]: filterBy.sortDir }
}

// {$or: [{vendor :{$regex:'b', $options:"i"}}, {'owner.fullname' :{$regex:'b', $options:"i"}}]}