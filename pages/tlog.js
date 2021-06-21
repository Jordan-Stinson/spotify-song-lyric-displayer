var querystring = require("querystring");

var spotify_client_id = "568d57d056c5466e8cde173cc4e896da"; // Your client id
var redirect_uri = "http://localhost:3000/callback"; // Your redirect uri

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */

var generateRandomString = function (length) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

export default function getStaticProps() {
  var stateKey = "spotify_auth_state";
  var state = generateRandomString(16);

  var scope =
    "user-read-private user-read-email user-read-currently-playing user-read-playback-state";
  var url =
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify({
      response_type: "code",
      client_id: spotify_client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state,
    });
  return (
    <button
      type="button"
      onClick={location.replace(url)}
      style={{ visibility: "hidden" }}
    ></button>
  );
}
