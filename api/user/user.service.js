import { asyncLocalStorage } from '../../services/als.service.js'
import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { reviewService } from '../review/review.service.js'
import { ObjectId } from 'mongodb'

export const userService = {
    getById, // Read (Profile page)
    save, // Save (Edit profile or create user)
    remove, // Delete (remove user)
    query, // List (of users)
    getByUsername, // Used for Login
    getByEmail // Used for Sign up
}

async function query() {
    try {
        const collection = await dbService.getCollection('user')
        const projection = _buildProjection()
        const users = await collection.find({ projection }).toArray()
        return users
    } catch (err) {
        logger.error('cannot find users', err)
        throw err
    }
}

async function getById(userId) {
    try {
        const criteria = { _id: ObjectId.createFromHexString(userId) }
        const collection = await dbService.getCollection('user')
        const user = await collection.findOne(criteria, { projection })
        return user
    } catch (err) {
        logger.error(`Cannot find user by _id: ${userId}`, err)
        throw err
    }
}

async function getByUsername(username) {
    try {
        const collection = await dbService.getCollection('user')
        const user = await collection.findOne({ username })
        return user
    } catch (err) {
        logger.error(`Cannot find user by username: ${username}`, err)
        throw err
    }
}
async function getByEmail(email) {
    try {
        const collection = await dbService.getCollection('user')
        const user = await collection.findOne({ email })
        return user
    } catch (err) {
        logger.error(`Cannot find user by username: ${username}`, err)
        throw err
    }
}

async function remove(userId) {
    try {
        const criteria = { _id: ObjectId.createFromHexString(userId) }
        const collection = await dbService.getCollection('user')
        const { deletedCount } = await collection.deleteOne(criteria)

        if (deletedCount === 0) throw new Error(`Cannot remove user with _id ${userId}`)
    } catch (err) {
        logger.error(`cannot remove user ${userId}`, err)
        throw err
    }
}

async function save(userToSave) {
    try {
        const collection = await dbService.getCollection('user')
        if (userToSave.id) {
            const loggedInUser = asyncLocalStorage.getStore()
            if (loggedInUser._id !== userToSave._id) throw new Error("Not your profile")
            const criteria = {
                _id: ObjectId.createFromHexString(userToSave._id)
            }
            const userToUpdate = structuredClone(userToSave)
            delete userToUpdate._id
            const { modifiedCount } = await collection.updateOne(criteria, { $set: userToUpdate })
            if (modifiedCount === 0) throw new Error(`Cannot update user with _id ${userToSave._id}`)
        }
        else {
            userToSave.imgUrl = ''
            userToSave.isAdmin = false
            await collection.insertOne(userToSave)
        }
        return userToSave
    } catch (err) {
        logger.error(`cannot update user ${user._id}`, err)
        throw err
    }
}

function _buildProjection() {
    return {
        fullname: true,
        imgUrl: true
    }
}