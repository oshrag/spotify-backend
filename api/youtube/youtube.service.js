// import { ObjectId } from 'mongodb'
import { logger } from '../../services/logger.service.js'
// import { dbService } from '../../services/db.service.js'
// import { asyncLocalStorage } from '../../services/als.service.js'

export const youtubeService = {
    query
}

async function query(userInput, location) {
    console.log('youTube Service query userInput', userInput)
    try {
        const searchTerm = userInput
        let maxResults = 4
        if (location === "search-at-station") {
            maxResults = 15
        }
        let res = await fetch(`https://www.googleapis.com/youtube/v3/search?q=${searchTerm}&part=snippet&type=video&videoCategoryId=10&maxResults=${maxResults}&key=${process.env.YOUTUBE_API_KEY}`)
        let data = await res.json()
        let songs = data.items
        const songIds = _getSongIds(songs)
        const songIdsStr = songIds.join(',')
        res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${songIdsStr}&key=${process.env.YOUTUBE_API_KEY}`)
        data = await res.json()
        const songsAdditionalInfo = data.items
        _addDurationToSongs(songs, songsAdditionalInfo)
        songs = songs.filter(song => song.duration)
        songs = _formatSongs(songs)
        return songs
    } catch (err) {
        logger.error('cannot find youtubeSongs', err)
        throw err
    }
}




function _getSongIds(songs) {
    const songIds = []
    songs.forEach(song => {
        songIds.push(song.id.videoId)
    })

    return songIds
}

function _addDurationToSongs(songs, songsAdditionalInfo) {
    songs.forEach(song => {
        const songAdditionalInfo = songsAdditionalInfo.find(songAdditionalInfo => songAdditionalInfo.id === song.id.videoId)
        if (songAdditionalInfo) {
            song.duration = songAdditionalInfo.contentDetails.duration
        }
    })
}


function _formatSongs(songs) {
    const formattedSongs = []
    songs.forEach(song => {
        formattedSongs.push(_formatSong(song))
    });

    return formattedSongs
}

function _formatSong(song) {
    return {
        id: song.id.videoId,
        title: _getSubstringBeforePipe(song.snippet.title),
        //title: song.snippet.title,
        channelTitle: song.snippet.channelTitle,
        url: `https://youtube.com/watch?v=${song.id.videoId}`,
        imgUrl: song.snippet.thumbnails.default.url,
        addedBy: {},
        addedAt: null,
        duration: _formatSongDuration(song.duration)
    }
}

function _formatSongDuration(songDuration) {
    // Examples of durations: 'PT4M' | 'PT35S' | 'PT4M35S'

    let formattedDuration = null
    if (!songDuration.includes('S')) {
        const minutes = songDuration.substring(2, songDuration.indexOf('M'))
        formattedDuration = `${minutes}:00`
    }
    if (!songDuration.includes('M')) {
        const seconds = songDuration.substring(2, songDuration.indexOf('S'))
        const formattedSeconds = seconds.length < 2 ? `0${seconds}` : seconds
        formattedDuration = `0:${formattedSeconds}`
    }
    if (songDuration.includes('S') && songDuration.includes('M')) {
        formattedDuration = songDuration.substring(2, songDuration.indexOf('S'))
        const [minutes, seconds] = formattedDuration.split('M')
        const formattedSeconds = seconds.length < 2 ? `0${seconds}` : seconds

        formattedDuration = `${minutes}:${formattedSeconds}`
    }

    return formattedDuration
}


function _getSubstringBeforePipe(str) {
    // בדוק אם המחרוזת מכילה את התו '|'
    const pipeIndex = str.indexOf('|');

    // אם אין את התו '|', החזר את המחרוזת כולה
    if (pipeIndex === -1) {
        return str;
    }
    // אחרת, החזר את החלק של המחרוזת עד ל-| הראשון (לא כולל)
    return str.substring(0, pipeIndex);
}



