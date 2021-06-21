const axios = require("axios");
const cio = require("cheerio-without-node-native");

var spotify_client_id = "568d57d056c5466e8cde173cc4e896da"; // Your client id
var spotify_client_id_backup = "d7cb71f86adf4c7c8510375650cc9b4b";

var genius_access_token =
  "XvVEfC_K7XQ7XNla_g9VKubWaoiLL8zHtP479dk2KMgcMmZ6y782Htz-YR_Swr73";

var isSubSeq = (artists, potential_song_name) => {
  potential_song_name = potential_song_name
    .split("")
    .filter(
      (x) =>
        ("a" <= x && x <= "z") ||
        ("A" <= x && x <= "Z") ||
        ("0" <= x && x <= "9") ||
        x == " " ||
        x == "&"
    )
    .join("")
    .toLowerCase()
    .trim();
  var found = true;
  for (let j = 0; j < artists.length; j++) {
    let s = artists[j]
      .split("")
      .filter(
        (x) =>
          ("a" <= x && x <= "z") ||
          ("A" <= x && x <= "Z") ||
          ("0" <= x && x <= "9") ||
          x == " " ||
          x == "&"
      )
      .join("")
      .toLowerCase()
      .trim();
    var pre = -1;

    for (var i = 0; i < potential_song_name.length; i++) {
      var cur = s.indexOf(potential_song_name[i], pre + 1);
      if (cur < 0 || cur <= pre) {
        found = false;
      }
      pre = cur;
    }
    if (found || s == potential_song_name) return true;
  }
  return false;
};

var isSubSequence = (artists, potential_song_name) => {
  potential_song_name = potential_song_name
    .split("")
    .filter(
      (x) =>
        ("a" <= x && x <= "z") ||
        ("A" <= x && x <= "Z") ||
        ("0" <= x && x <= "9") ||
        x == " " ||
        x == "&"
    )
    .join("")
    .toLowerCase()
    .trim();
  var found = true;
  for (let j = 0; j < artists.length; j++) {
    let s = artists[j]
      .split("")
      .filter(
        (x) =>
          ("a" <= x && x <= "z") ||
          ("A" <= x && x <= "Z") ||
          ("0" <= x && x <= "9") ||
          x == " " ||
          x == "&"
      )
      .join("")
      .toLowerCase()
      .trim();
    var pre = -1;

    for (var i = 0; i < s.length; i++) {
      var cur = potential_song_name.indexOf(s[i], pre + 1);
      if (cur < 0 || cur <= pre) {
        found = false;
      }
      pre = cur;
    }
    if (found || s == potential_song_name) return true;
  }
  return false;
};

export default async function handler(req, res) {
  var refresh_token = req.headers.refresh_token;
  var access_token;
  var song_name, song_artist, album_name, album_image, song_artists;

  let refresh_token_function = async () => {
    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", refresh_token);
    try {
      const r = await axios
        .post("https://accounts.spotify.com/api/token", params, {
          headers: {
            Authorization:
              "Basic " +
              new Buffer(
                spotify_client_id + ":" + spotify_client_id_backup
              ).toString("base64"),
          },
        })
        .then(
          (response) => {
            return new Promise((resolve) => {
              resolve(response.data);
            });
          },
          (err) => {
            console.error(err.config, "error");
          }
        );
      return r;
    } catch (e) {
      console.error(e, "error 2");
      return e;
    }
  };

  let get_player_data = async () => {
    try {
      const r = await axios
        .get("https://api.spotify.com/v1/me/player", {
          headers: { Authorization: "Bearer " + access_token },
        })
        .then(
          (response) => {
            return new Promise((resolve) => {
              resolve(response.data);
            });
          },
          (err) => {
            console.error(err.config, "error");
          }
        );
      return r;
    } catch (e) {
      console.error(e, "error in player fetch");
    }
  };

  let simple_genius_search = async (song_artist, filtered_song_name) => {
    try {
      const r = await axios
        .get(
          "https://api.genius.com/search?q=" +
            song_artist +
            " " +
            filtered_song_name,
          { headers: { Authorization: "Bearer " + genius_access_token } }
        )
        .then(
          (response) => {
            return new Promise((resolve) => {
              resolve(response.data.response.hits);
            });
          },
          (err) => {
            console.error(err.config, "error");
          }
        );
      return r;
    } catch (e) {
      console.error(e, "error in player fetch");
    }
  };

  let obtain_genius_artist_id = async (song_artist) => {
    try {
      const r = await axios
        .get("https://api.genius.com/search?q=" + song_artist, {
          headers: { Authorization: "Bearer " + genius_access_token },
        })
        .then(
          (response) => {
            return new Promise((resolve) => {
              resolve(response.data.response.hits[0].result.primary_artist.id);
            });
          },
          (err) => {
            console.error(err.config, "error");
          }
        );
      return r;
    } catch (e) {
      console.error(e, "error in player fetch");
    }
  };

  let obtain_genius_artist_songs = async (song_artist_id, page) => {
    try {
      const r = await axios
        .get(
          "https://api.genius.com/artists/" +
            song_artist_id +
            "/songs" +
            "?per_page=50" +
            "&page=" +
            page +
            "&sort=popularity",
          {
            headers: { Authorization: "Bearer " + genius_access_token },
          }
        )
        .then(
          (response) => {
            return new Promise((resolve) => {
              resolve(response.data.response.songs);
            });
          },
          (err) => {
            console.error(err.config, "error");
          }
        );
      return r;
    } catch (e) {
      console.error(e, "error in player fetch");
    }
  };

  let fetch_song_lyrics = async (url) => {
    try {
      const r = await axios.get(url).then(
        (response) => {
          let data = response.data;
          let htmlDom = cio.load(data);
          let lyrics = htmlDom('div[class="lyrics"]').text().trim();
          // The code in the following if loop was taken straight from
          //https://github.com/farshed/genius-lyrics-api/blob/master/lib/utils/extractLyrics.js.
          //Big thanks to Faisal for giving me permission to use his code.
          if (!lyrics) {
            lyrics = "";
            htmlDom('div[class^="Lyrics__Container"]').each((i, elem) => {
              if (htmlDom(elem).text().length !== 0) {
                let snippet = htmlDom(elem)
                  .html()
                  .replace(/<br>/g, "\n")
                  .replace(/<(?!\s*br\s*\/?)[^>]+>/gi, "");
                lyrics +=
                  htmlDom("<textarea/>").html(snippet).text().trim() + "\n\n";
              }
            });
          }
          // The code above was taken from
          //https://github.com/farshed/genius-lyrics-api/blob/master/lib/utils/extractLyrics.js
          if (lyrics) {
            return new Promise((resolve) => {
              resolve(lyrics);
            });
          } else {
            return new Promise((resolve) => {
              resolve(null);
            });
          }
        },
        (err) => {
          console.error(err.config, "error");
        }
      );
      return r;
    } catch (e) {
      console.error(e, "error in player fetch");
    }
  };

  var myRes = await refresh_token_function();
  access_token = myRes.access_token;

  var player_data = await get_player_data();
  song_name = player_data.item.name;
  song_artist = player_data.item.artists[0].name;
  song_artists = player_data.item.artists.map((x) => x.name);
  album_name = player_data.item.album.name;
  album_image = player_data.item.album.images[0].url;

  if (!song_artist || !song_name) {
    myRes = await refresh_token_function();
    access_token = myRes.access_token;
    var player_data = await get_player_data();
    song_name = player_data.item.name;
    song_artist = player_data.item.artists[0].name
      .split("")
      .filter(
        (x) =>
          ("a" <= x && x <= "z") ||
          ("A" <= x && x <= "Z") ||
          ("0" <= x && x <= "9") ||
          x == " " ||
          x == "&"
      )
      .join("")
      .toLowerCase()
      .trim();
    song_artists = player_data.item.artists.map((x) =>
      x.name
        .split("")
        .filter(
          (x) =>
            ("a" <= x && x <= "z") ||
            ("A" <= x && x <= "Z") ||
            ("0" <= x && x <= "9") ||
            x == " " ||
            x == "&"
        )
        .join("")
        .toLowerCase()
        .trim()
    );
    album_name = player_data.item.album.name;
    album_image = player_data.item.album.images[0].url;
  }

  if (!song_artist || !song_name) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json({
      error_message: "Could not fetch song name or song artist from Spotify",
    });
    return 0;
  }

  var filtered_song_name = song_name
    .split("")
    .filter(
      (x) =>
        ("a" <= x && x <= "z") ||
        ("A" <= x && x <= "Z") ||
        ("0" <= x && x <= "9") ||
        x == " " ||
        x == "&"
    )
    .join("")
    .toLowerCase()
    .trim();

  var lyrics_found = false;
  for (let index = 0; !lyrics_found && index < song_artists.length; index++) {
    song_artist = song_artists[index];
    var genius_fetch_highlights = await simple_genius_search(
      song_artist,
      filtered_song_name
    );

    for (
      let h_index = 0;
      h_index < genius_fetch_highlights.length && !lyrics_found;
      h_index++
    ) {
      let potential_song_title = genius_fetch_highlights[h_index].result.title
        .split("")
        .filter(
          (x) =>
            ("a" <= x && x <= "z") ||
            ("A" <= x && x <= "Z") ||
            ("0" <= x && x <= "9") ||
            x == " " ||
            x == "&"
        )
        .join("")
        .toLowerCase()
        .trim();
      if (
        !(
          isSubSeq([filtered_song_name], potential_song_title) ||
          isSubSequence([filtered_song_name], potential_song_title)
        )
      ) {
        potential_song_title = genius_fetch_highlights[
          h_index
        ].result.title_with_featured
          .split("")
          .filter(
            (x) =>
              ("a" <= x && x <= "z") ||
              ("A" <= x && x <= "Z") ||
              ("0" <= x && x <= "9") ||
              x == " " ||
              x == "&"
          )
          .join("")
          .toLowerCase()
          .trim();
      }

      if (
        isSubSeq([filtered_song_name], potential_song_title) ||
        isSubSequence([filtered_song_name], potential_song_title)
      ) {
        let potential_song_artist = genius_fetch_highlights[
          h_index
        ].result.primary_artist.name
          .split("")
          .filter(
            (x) =>
              ("a" <= x && x <= "z") ||
              ("A" <= x && x <= "Z") ||
              ("0" <= x && x <= "9") ||
              x == " " ||
              x == "&"
          )
          .join("")
          .toLowerCase()
          .trim();
        if (
          isSubSeq(song_artists, potential_song_artist) ||
          isSubSequence(song_artists, potential_song_artist)
        ) {
          let song_lyrics_url = genius_fetch_highlights[h_index].result.url;
          var lyrics = await fetch_song_lyrics(song_lyrics_url);
          if (lyrics) {
            lyrics_found = true;
            lyrics = lyrics.split("\n");
            lyrics_found = true;

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json({
              access_token: access_token,
              song_name: song_name,
              song_artist: song_artist,
              song_artists: song_artists,
              album_image: album_image,
              album_name: album_name,
              lyrics: lyrics,
              lyrics_url: song_lyrics_url,
            });
          }
        }
      }
    }
  }

  for (let index = 0; !lyrics_found && index < song_artists.length; index++) {
    song_artist = song_artists[index];
    let song_artist_id = await obtain_genius_artist_id(song_artist);
    for (let p = 1; p < 5; p++) {
      let songs = await obtain_genius_artist_songs(song_artist_id, p);
      for (var i = 0; i < songs.length; i++) {
        let temp_song_title = songs[i].title
          .split("")
          .filter(
            (x) =>
              ("a" <= x && x <= "z") ||
              ("A" <= x && x <= "Z") ||
              ("0" <= x && x <= "9") ||
              x == " " ||
              x == "&"
          )
          .join("")
          .toLowerCase()
          .trim();
        if (
          isSubSeq([filtered_song_name], temp_song_title) ||
          isSubSequence([filtered_song_name], temp_song_title)
        ) {
          var song_id = songs[i].id;
          let song_lyrics_url = "https://api.genius.com/songs/" + song_id;
          let lyrics = await fetch_song_lyrics(song_lyrics_url);
          if (lyrics) {
            lyrics_found = true;
            lyrics = lyrics.split("\n");
            lyrics_found = true;

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json({
              access_token: access_token,
              song_name: song_name,
              song_artist: song_artist,
              song_artists: song_artists,
              album_image: album_image,
              album_name: album_name,
              lyrics: lyrics,
              lyrics_url: song_lyrics_url,
            });
          }
        }
      }
    }
  }
  if (!lyrics_found) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json({
      access_token: access_token,
      error: "could not find lyrics",
    });
  }
}
