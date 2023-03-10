const webPlayback = {

  /**
   * Set song being played
   *
   * @param {*} access_token - auth token
   * @param {*} refresh_token - refresh token
   * @param {*} uri - the track to play
   */
  setPlayback: (access_token, refresh_token, uri) => {
    const body = {
      context_uri: uri
    };

    return axios.put(`/spotify/play/${access_token}`, body)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      handleError(error);
    });
  },

  /**
   * Creates and then connects to a 'device' - something a Spotify user can play music through.  In this case, play music through our Web App.
   *
   * @param {*} access_token - auth token
   * @param {*} refresh_token - refresh token
   * @param {*} setPlayer - dispatches player to store
   * @param {*} setPaused - dispatches paused to store
   * @param {*} setActive - dispatches active to store
   * @param {*} setTrack - dispatches track to store
   */
  createAndConnectDevice: async (access_token, refresh_token, setPlayer, setPaused, setActive, setTrack) => {

    // https://developer.spotify.com/documentation/web-playback-sdk/guide/#react-components
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {

        const player = new window.Spotify.Player({
            name: 'Spotify V2',
            getOAuthToken: cb => {
              cb(access_token);
            },
            volume: 0.2
        });

        setPlayer(player);

        player.addListener('ready', ({ device_id }) => {
            console.log('Ready with Device ID', device_id);
            const connectToDevice = () => {
              const body = {
                device_ids: [device_id],
                play: false,
              }
              axios.put(`${SERVER_ADDR}/spotify/player/${access_token}`, body)
                .catch((error) => {
                  handleError(error);
                });
            }

            connectToDevice();
        });

        player.addListener('not_ready', ({ device_id }) => {
            console.log('Device ID has gone offline', device_id);
        });

        player.addListener("authentication_error", ({ message }) => {
          console.error(message);
        });

        player.addListener('player_state_changed', ( state => {

          if (!state) {
              return;
          }

          setTrack(state.track_window.current_track);
          setPaused(state.paused);


          player.getCurrentState().then( state => {
              (!state)? setActive(false) : setActive(true)
          });

        }));

        player.connect().then((success) => {
          if (success) {
            console.log("The Web Playback SDK successfully connected to Spotify!");
          }
        });;

    };
  },
}