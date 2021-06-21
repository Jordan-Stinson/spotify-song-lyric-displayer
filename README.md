Allows Users to see the lyrics in browser for whatever song they listen to on Spotify. Comes with auto-refresh so that the app is hands-free.

  To use this app follow these steps:
  
  1. clone this repo to your local machine
  2. run ```npm install```
  3. run ```npm run dev```

This will start the app on http://localhost:3000

Upon loading, the app will ask you to login through spotify, so that it can access the following information from your account: 
Your email, the type of Spotify subscription you have, your account country and your settings for explicit content filtering, your name and username, your profile picture, how many followers you have on Spotify, your public playlists, the content you are playing and Spotify Connect devices information. 

After authenticating through Spotify, you will be redirected to a page which displays the name of the user account currently authenticated, and a button. 

This button acts as a toggle, turning the search for lyrics for the current player on/off. When off, no data is sent/received. When on, the app will attempt to find the lyrics for the user's song every 5 seconds. This allows the app to fetch lyrics even after songs change, without the user having to click anything. 
Upon fetching the lyrics, the album name, album cover, artists on the song, song name, and lyrics will all be displayed in simple html for the user to see.
