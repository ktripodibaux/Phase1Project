document.addEventListener('DOMContentLoaded', () => {
    const home = document.querySelector('img')
    const formArtist = document.querySelector('.formArtist')
    const inputArtist = document.querySelector('#searchS')
    const formGenre = document.querySelector('.search')
    const inputGenre = document.querySelector('#genreS')
    resetDom() 
    home.addEventListener('click', ()=>{
        resetDom()
        addHidden()
    })
    
    formArtist.addEventListener('submit', (event)=>{
        event.preventDefault()
        searchArtist(inputArtist.value)
        removeHidden()
        inputArtist.value = ''
        inputArtist.textContent = ''
    })
    
    formGenre.addEventListener('submit', (event) => {
        event.preventDefault()
        genreSearch(inputGenre.value)
        removeHidden()
        inputGenre.value=''
        inputGenre.textContent=''
    })
    
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
            closeVideo();
        }
    });
});

const overlay = document.querySelector('.overlay')
let currentVideo = 0;
let currentArtist;
const videoResults = []

function searchArtist (input) {
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': key,
            'X-RapidAPI-Host': 'spotify23.p.rapidapi.com'
        }
    };
    resetDom();
    loadSavedMusic()
    
    input.replace(/ /g,"%20");
    fetch(`https://spotify23.p.rapidapi.com/search/?q=${input}&type=multi&offset=0&limit=10&numberOfTopResults=5`, options)
        .then(response => response.json())
        .then(response => {
            currentArtist = response.artists.items[0].data.uri
            currentArtist = currentArtist.replace('spotify:artist:', '')
            const songsMeta = []
            for (let i = 0; i<5; i++) {
                songsMeta.push(response.tracks.items[i])
            }

            const songs = []
            songsMeta.forEach(function (object){
                const newObject = {}
                newObject.name = object.data.name
                newObject.cover = object.data.albumOfTrack.coverArt.sources[0].url 
                newObject.albumName = object.data.albumOfTrack.name
                newObject.band = object.data.artists.items[0].profile.name
                newObject.id = object.data.id
                songs.push(newObject)
            })
            songs.forEach(song=>appendSongToDom(song))
            
            const playlists = []
        for (let i = 0; i<3; i++){
            newObj = {}
            newObj.name = response.playlists.items[i].data.name
            newObj.cover = response.playlists.items[i].data.images.items[0].sources[0].url
            newObj.id = response.playlists.items[i].data.uri
            newObj.id = newObj.id.replace('spotify:playlist:', '')
            playlists.push(newObj)

            
        }
        playlists.forEach(list=>appendPlaylistToDOM(list))
            findRelatedArtists()
        });
}

function genreSearch(input) {
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': key,
            'X-RapidAPI-Host': 'spotify23.p.rapidapi.com'
        }
    };

    input.replace(/ /g,"%20");
    fetch(`https://spotify23.p.rapidapi.com/search/?q=${input}&type=multi&offset=0&limit=10&numberOfTopResults=5`, options)
    .then(response => response.json())
    .then(response => {
        resetDom();
        fetch('http://localhost:3000/songs').then(response=>response.json()).then(response=> {
        response.forEach(appendSavedSongToDom)
    })

        let playlist = response.playlists.items[4].data.uri
        playlist = playlist.replace('spotify:playlist:', '')
        const playlists = []
        for (let i = 0; i<3; i++){
            newObj = {}
            newObj.name = response.playlists.items[i].data.name
            newObj.cover = response.playlists.items[i].data.images.items[0].sources[0].url
            newObj.id = response.playlists.items[i].data.uri
            newObj.id = newObj.id.replace('spotify:playlist:', '')
            playlists.push(newObj)
        }
        playlists.forEach(list=>appendPlaylistToDOM(list))

        fetch(`https://spotify23.p.rapidapi.com/playlist_tracks/?id=${playlist}&offset=0&limit=100`, options).then(response=>response.json()).then(response=>{
            const songsMeta = []
            for (let i = 0; i<5; i++) {
                if (i == 0) {
                    currentArtist = response.items[0].track.artists[0].id
                    findRelatedArtists()
                }
                songsMeta.push(response.items[i])
            }
            const songs = []
            songsMeta.forEach(function (object){
                const newObject = {}
                newObject.name = object.track.name
                newObject.cover = object.track.album.images[0].url
                newObject.albumName = object.track.album.name
                newObject.band = object.track.artists[0].name
                newObject.id = object.track.id
                songs.push(newObject)
            })
            songs.forEach(song=>appendSongToDom(song))
        })   
    })
    .catch(err => console.error(err));
}

function appendSongToDom(object) {
    const div = document.createElement('div')
    const video = document.createElement('div')
    const title = document.createElement('h3')
    const album = document.createElement('h5')
    const year = document.createElement('p')
    const cover = document.createElement('img')
    const lowerDiv = document.createElement('div')
    const artist = document.createElement('h6')
    const btn = document.createElement('button')
    const spotify = document.createElement('button')
    
    div.classList.add('song')
    
    cover.src = object.cover
    cover.classList.add('cover')
    
    title.textContent = object.name
    title.addEventListener('click', ()=>{
        saveSong(object)
        appendSavedSongToDom(object)
    })
    album.textContent = object.albumName
    
    artist.textContent = object.band
    artist.addEventListener('click', function(){
        searchArtist(object.band)
    })
    
    btn.textContent = 'Listen here'
    btn.addEventListener('click', () => {
        const search = object.name.replace(/ /g,"%20") + ' ' + object.band
        fetch(`https://youtube-v31.p.rapidapi.com/search?q=${search}&part=snippet%2Cid&regionCode=US&maxResults=10&order=date`, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': key,
                'X-RapidAPI-Host': 'youtube-v31.p.rapidapi.com'
            }})
            .then(response => response.json())
            .then(response => {
                currentVideo=0;
                videoResults.length = 0
                for(let video in response.items){
                    if (response.items[video].id.videoId){
                        videoResults.push(response.items[video].id.videoId)
                    }
                }   
                videolayout(object)
                scroll(0,0)
            })
            .catch(err => console.error(err));
            
        })
        
        spotify.classList.add('spotifyButton')
        spotify.textContent= 'Play on spotify'
        spotify.addEventListener('click', ()=> {
            window.open(`https://open.spotify.com/track/${object.id}`)
        }) 
        
        lowerDiv.classList.add('bottom')
        lowerDiv.append(artist, btn)
        
        div.append(cover,title,album, lowerDiv,spotify)
        document.querySelector('.musicResults').append(div)
    }

    function findRelatedArtists () {
        const options = {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': key,
                'X-RapidAPI-Host': 'spotify23.p.rapidapi.com'
            }
        };
        const div = document.querySelector('.relatedArtists')
        
        fetch(`https://spotify23.p.rapidapi.com/artist_related/?id=${currentArtist}`, options)
            .then(response => response.json())
            .then(response => {
                const artists = []
                for (let i = 0; i < 8; i++){
                    artists.push(response.artists[i])
                }
    
                artists.forEach((artist)=>{
                    const newArtist = {}
                    newArtist.picture = artist.images[2].url
                    newArtist.name = artist.name
    
                    const bound = document.createElement('div')
                    const h4 = document.createElement('h4')
                    const image = document.createElement('img')
                    h4.textContent = newArtist.name
                    h4.addEventListener('click', () => {
                        resetDom()
                        currentArtist=artist.id
                        searchArtist(newArtist.name)
                    })
                    image.src = newArtist.picture
                    image.classList.add('relatedCover')
                    bound.append(image,h4,)
                    div.append(bound)
                })
            })
            .catch(err => console.error(err));
        }

        function appendPlaylistToDOM (playlist) {
            const div = document.querySelector('.playlists')
            const container = document.createElement('div')
            const title = document.createElement('h3')
            const cover = document.createElement('img')
            const spotify = document.createElement('button')
            title.textContent = playlist.name
            
            title.addEventListener('click', () => {
                genreSearch(title.textContent)
            })
            cover.src = playlist.cover
            spotify.textContent= 'Play on spotify'
            spotify.addEventListener('click', ()=> {
                window.open(`https://open.spotify.com/playlist/${object.id}`)
            })
            container.append(cover,title,spotify)
            div.append(container)
        }
    
    const videolayout = function () {
        const button = document.createElement('button')
        const rButton = document.createElement('button')
        const lButton = document.createElement('button')
        const paragraph = document.createElement('p')
        
        paragraph.textContent = "Due to copyright restrictions, certain artists and labels don't allow their music to be embeded on other platforms. If a video isn't playable, or you just want to see more, feel free to explore the music from multiple creators!"
        paragraph.classList.add('paragraph')
        
    button.textContent = 'x'
    button.classList.add('closevideo')
    button.addEventListener('click', () => {
        closeVideo()
    })
    
    rButton.textContent='>'
    rButton.id='right'
    lButton.textContent='<'
    lButton.id='left'
    
    rButton.addEventListener('click', () => {
        currentVideo+=1
        if (currentVideo>videoResults.length){
            currentVideo = 0
        }
        overlay.innerHTML = ''
        videolayout()
    })
    
    lButton.addEventListener('click', ()=>{
        currentVideo-=1
        if (currentVideo<0){
            currentVideo = videoResults.length
        }
        overlay.innerHTML = ''
        videolayout()
    })
    
    overlay.innerHTML =`<iframe class='video' src="https://www.youtube.com/embed/${videoResults[currentVideo]}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
    overlay.append(button, rButton, lButton, paragraph)
    overlay.classList.remove('hidden')
}

const closeVideo = function() {
    overlay.classList.add('hidden');
    overlay.innerHTML=''
}

function saveSong (object) {
    fetch('http://localhost:3000/songs', {
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(object)
    })
}

function loadSavedMusic () {
    fetch('http://localhost:3000/songs').then(response=>response.json()).then(response=> {
        response.forEach(appendSavedSongToDom)
    })
}

function appendSavedSongToDom(object) {
    const div = document.createElement('div')
    const video = document.createElement('div')
    const title = document.createElement('h3')
    const album = document.createElement('h5')
    const year = document.createElement('p')
    const cover = document.createElement('img')
    const lowerDiv = document.createElement('div')
    const artist = document.createElement('h6')
    const btn = document.createElement('button')
    const spotify = document.createElement('button')

    div.classList.add('song')
    
    cover.src = object.cover
    cover.classList.add('cover')
    
    title.textContent = object.name
    title.addEventListener('click', () => {
        fetch('http://localhost:3000/songs').then(response=>response.json()).then(response=>{
            let id;
            for (let i = 0; i< response.length; i++) {
                if (response[i].name == object.name)  {
                    id = response[i].id
                }
            }
            fetch(`http://localhost:3000/songs/${id}`, {
                method: 'DELETE'
            })
            div.remove()
        })
    })
    album.textContent = object.albumName
    
    artist.textContent = object.band
    artist.addEventListener('click', function(){
        searchArtist(object.band)
    })
    
    spotify.classList.add('spotifyButton')
    spotify.textContent= 'Play on spotify'
    spotify.addEventListener('click', ()=> {
        window.open(`https://open.spotify.com/track/${object.id}`)
    }) 
    
    btn.textContent = 'Listen here'
    btn.addEventListener('click', () => {
        const search = object.name.replace(/ /g,"%20") + ' ' + object.band
        fetch(`https://youtube-v31.p.rapidapi.com/search?q=${search}&part=snippet%2Cid&regionCode=US&maxResults=10&order=date`, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': key,
                'X-RapidAPI-Host': 'youtube-v31.p.rapidapi.com'
            }})
            .then(response => response.json())
            .then(response => {
                currentVideo=0;
                videoResults.length = 0
                for(let video in response.items){
                    if (response.items[video].id.videoId){
                        videoResults.push(response.items[video].id.videoId)
                    }
                }      
                videolayout(object)
                scroll(0,0)
            })
            .catch(err => console.error(err));
            
        })
        lowerDiv.classList.add('bottom')
        lowerDiv.append(artist, btn)

        div.append(cover,title,album, lowerDiv,spotify)
        document.querySelector('.myMusic').append(div)
}

const removeHidden = function(){
    const title1 = document.querySelector('.title1')
    const title2 = document.querySelector('.title2')
    const title3 = document.querySelector('.title3')
    const title4 = document.querySelector('.title4')
    title1.classList.remove('hidden')
    title2.classList.remove('hidden')
    title3.classList.remove('hidden')
    title4.classList.remove('hidden') 
}

const addHidden = function(){
    const title1 = document.querySelector('.title1')
    const title2 = document.querySelector('.title2')
    const title3 = document.querySelector('.title3')
    const title4 = document.querySelector('.title4')
    title1.classList.add('hidden')
    title2.classList.add('hidden')
    title3.classList.add('hidden')
    title4.classList.add('hidden')
    
    const inputArtist = document.querySelector('#searchS')
    intputArtist.value = ''
    intputArtist.textContent = ''
    
    const inputGenre = document.querySelector('#genreS')
    inputGenre.value=''
    inputGenre.textContent=''
}

const resetDom = function(){
    const musicResults = document.querySelector('.musicResults')
    const playlists = document.querySelector('.playlists')
    const relatedArtists = document.querySelector('.relatedArtists')
    const savedMusic = document.querySelector('.myMusic')
    const title1 = document.querySelector('.title1')
    const title2 = document.querySelector('.title2')
    const title3 = document.querySelector('.title3')
    const title4 = document.querySelector('.title4')
    title1.innerHTML=''
    title2.innerHTML=''
    title3.innerHTML=''
    title4.innerHTML=''
    musicResults.innerHTML = ''
    playlists.innerHTML= ''
    relatedArtists.innerHTML = ''
    savedMusic.innerHTML=''

    const songTitle = document.createElement('h2')
    const playlistTitle = document.createElement('h3')
    const relatedTitle = document.createElement('h3') 
    const savedTitle =   document.createElement('h3') 
    songTitle.textContent = 'Song Results:'
    playlistTitle.textContent = 'Related Playlists:'
    relatedTitle.textContent = 'Similar Artists:'
    savedTitle.textContent = 'My Saved Music'

    title1.append(songTitle)
    title2.append(playlistTitle)
    title3.append(relatedTitle)
    title4.append(savedTitle) 
}