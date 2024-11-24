import Cryptr from 'cryptr'
import bcrypt from 'bcrypt'

import { userService } from '../user/user.service.js'
import { logger } from '../../services/logger.service.js'
import { stationService } from '../station/station.service.js'

const cryptr = new Cryptr(process.env.SECRET)

export const authService = {
    signup,
    login,
    getLoginToken,
    validateToken,
}

async function login({ username, password }) {
    try {
        if (!username || !password) throw new Error("Cannot have empty fields")
        const user = await userService.getByUsername(username)
        if (!user) throw new Error('Username not found')

        const match = await bcrypt.compare(password, user.password)
        if (!match) throw new Error('Invalid username or password')

        return _getMiniUser(user)
    } catch (error) {
        logger.error("Cannot login", error)
        throw error
    }
}

async function signup({ fullname, username, password, email }) {
    try {
        if (!fullname || !username || !password || !email) {
            throw new Error("Cannot have empty fields")
        }
        const saltRounds = 10
        let userExists = await userService.getByUsername(username)
        if (userExists) throw new Error('Username already exists')
        userExists = await userService.getByEmail(email)
        if (userExists) throw new Error('Email already exists')
        const hash = await bcrypt.hash(password, saltRounds)
        let userToSave = {
            fullname,
            username,
            password: hash,
            email
        }
        userToSave = await userService.save(userToSave)
        const {_id, ...rest} = _getMiniUser(userToSave)
        const createdBy = {id: _id, ...rest}
        await stationService.createLikedSongsStation(createdBy)
        return _getMiniUser(userToSave)
    } catch (error) {
        logger.error("Cannot sign up", error)
        throw error
    }
}

function getLoginToken(user) {
    const strUser = JSON.stringify(user)
    const loginToken = cryptr.encrypt(strUser)
    return loginToken
}

function validateToken(loginToken) {
    try {
        const strUser = cryptr.decrypt(loginToken)
        const loggedinUser = JSON.parse(strUser)
        return loggedinUser
    } catch (err) {
        logger.error('Invalid login token', err)
        return null
    }
}

function _getMiniUser(user) {
    return {
        _id: user._id,
        fullname: user.fullname,
        imgUrl: user.imgUrl,
        isAdmin: user.isAdmin
    }
}