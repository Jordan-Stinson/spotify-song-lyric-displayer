import { useState, useEffect } from "react";
const axios = require("axios");

var spotify_client_id = "568d57d056c5466e8cde173cc4e896da"; // Your client id
var spotify_client_id_backup = "d7cb71f86adf4c7c8510375650cc9b4b";
var redirect_uri = "http://localhost:3000/callback"; // Your redirect uri
var stateKey = "spotify_auth_state";

function Temp(props) {
  const [toggleState, setToggleState] = useState(false);
  const [flip, setFlip] = useState(false);
  const [lyrics, setLyrics] = useState([]);
  const [resData, setResData] = useState({});
  useEffect(() => {
    if (toggleState) {
      axios
        .get("/api/getLyrics", {
          headers: { refresh_token: props.refresh_token },
        })
        .then((response) => {
          if (response.data && response.data.lyrics) {
            setLyrics(response.data.lyrics);
            setResData(response.data);
          } else if (response.data) {
            setLyrics(["could not find lyrics"]);
            setResData(response.data);
          } else if (response.error) {
            setLyrics(["error fetching lyrics"]);
            setResData({});
          } else {
            setResData({});

            setLyrics(["error fetching lyrics"]);
          }
          setTimeout(() => {
            setFlip(!flip);
          }, 5000);
        });
    }
  }, [toggleState, flip]);
  return (
    <div>
      <p>User: {props.user_info.id}</p>
      <button onClick={() => setToggleState(!toggleState)}>
        {toggleState ? "Turn Off Lyric Search" : "Turn On Lyric Search"}
      </button>
      {resData.song_name ? (
        <div style={{ display: "flex", flexDirection: "row" }}>
          <div style={{ marginRight: 20 }}>
            <p>Album Cover</p>
            <img
              src={resData.album_image ? resData.album_image : ""}
              height={256}
              width={256}
            ></img>
          </div>
          <div style={{ marginRight: 20 }}>
            <p>Album name</p>
            <p>{resData.album_name ? resData.album_name : ""}</p>
          </div>
          <div style={{ marginRight: 20 }}>
            <p>Artist(s)</p>
            <p>{resData.song_artists ? resData.song_artists.join(", ") : ""}</p>
          </div>
          <div style={{ marginRight: 20 }}>
            <p>Song name</p>
            <p>{resData.song_name ? resData.song_name : ""}</p>
          </div>
        </div>
      ) : (
        <></>
      )}
      {lyrics.map((item) => (
        <p>{item}</p>
      ))}
    </div>
  );
}

export async function getServerSideProps({ req }) {
  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.__NEXT_INIT_QUERY.code || null;
  var state = req.__NEXT_INIT_QUERY.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  let auth_start_function = async () => {
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("redirect_uri", redirect_uri);
    params.append("code", code);
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
              resolve(response);
            });
          },
          (err) => {
            return err;
          }
        );
      return r;
    } catch (e) {
      return e;
    }
  };

  var authValues = await auth_start_function();

  if (authValues && authValues.status === 200) {
    var access_token = authValues.data.access_token,
      refresh_token = authValues.data.refresh_token;

    let get_user_info = async () => {
      try {
        const r = await axios
          .get("https://api.spotify.com/v1/me", {
            headers: { Authorization: "Bearer " + access_token },
          })
          .then(
            (response) => {
              return new Promise((resolve) => {
                resolve(response);
              });
            },
            (err) => {}
          );
        return r;
      } catch (e) {
        return e;
      }
    };

    let user_info = await get_user_info();
    return {
      props: {
        user_info: user_info.data,
        refresh_token: refresh_token,
      },
    };
  } else {
    return {
      props: {},
      redirect: {
        destination: "/errors",
        permanent: true,
      },
    };
  }
}

export default Temp;
