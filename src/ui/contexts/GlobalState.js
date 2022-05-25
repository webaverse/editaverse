import React, { createContext, useReducer } from "react";
import AppReducer from "./AppReducer";
import axios from "axios";
import configs from "../../configs";

//import { MetamaskManager, ProfileManager, DiscordManager } from "webaverse-blockchain-lib/dist"

const LOCAL_STORE_KEY = "___hubs_store";
const LOCAL_ACCESS_TOKEN = "access_token";
const E_MAIL_ADDRESS = "email_address";

export const getAuth = () => {
  const value = localStorage.getItem(LOCAL_STORE_KEY);

  if (!value) {
    console.error("Not authenticated");
  }
  try {
    const store = JSON.parse(value);

    if (!store) {
      console.error("Not authenticated");
    }

    return store;
  } catch (e) {
    console.error("Not authenticated");
  }
};

//Initial state
const initialState = {
  auth: getAuth(),
  resEmail: ""
};

//Create context
export const GlobalContext = createContext(initialState);

// Provider component
// eslint-disable-next-line react/prop-types
export const GlobalProvider = ({ children }) => {
  const [state, dispatch] = useReducer(AppReducer, initialState);

  /*
  const getDiscordUserInfo = async accessToken => {
    try {
      const response = await axios.get("https://discord.com/api/users/@me", {
        headers: {
          authorization: `${accessToken.data.token_type} ${accessToken.data.access_token}`
        }
      });
      return response.data;
    } catch (error) {
      console.log(error);
    }
  };*/

  /* const getDiscordToken = async code => {
    const options = new URLSearchParams({
      client_id: configs.DISCORD_CLIENT_ID,
      client_secret: configs.DISCORD_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: configs.DISCORD_REDIRECT,
      scope: "identify email guilds"
    });
    try {
      const result = await axios.post("https://discord.com/api/oauth2/token", options);
      return result;
    } catch (error) {
      console.log(error);
    }
  };*/

  //Actions
  const authAction = {
    auth: state.auth,
    resEmail: state.resEmail,
    metaMaskLogin: async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        const [address] = await window.ethereum.request({
          method: "eth_requestAccounts"
        });

        const params = {
          metamaskWalletAddress: address
        };
        authAction.login(params);
      } else {
        dispatch({
          type: "LOGIN_ERROR",
          payload: {
            address: null
          }
        });
      }
    },
    loginWithDiscord: async code => {
      const params = {
        discordcode: code,
        redirect_uri: configs.DISCORD_REDIRECT
      };
      authAction.login(params);
    },
    login: async params => {
      const result = await axios.post(`${configs.SERVER_URL}/login`, null, { params });
      if (result.status == 200) {
        //localStorage.setItem(LOCAL_ACCESS_TOKEN, JSON.stringify(accessToken.data.access_token));
        localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(result.data));
        dispatch({
          type: "USER_LOGIN",
          payload: result.data
        });
      } else {
        dispatch({
          type: "LOGIN_ERROR",
          payload: {
            address: null
          }
        });
      }
    },
    /* getInfo: async (code) => {
       try {
         const discord = new DiscordManager();
         const user = await discord.login(code);
         console.log(user)
         localStorage.setItem(LOCAL_ACCESS_TOKEN, JSON.stringify(user.accessToken))
         localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(user.data));
         dispatch({
           type: "USER_LOGIN",
           payload: user.data
         })
       } catch (error) {
         console.error(error);
         dispatch({
           type: "LOGIN_ERROR",
           payload: null
         })
       }
 
     },*/
    logout: () => {
      localStorage.removeItem(LOCAL_STORE_KEY);
      localStorage.removeItem(LOCAL_ACCESS_TOKEN);
      dispatch({
        type: "LOGOUT_USER",
        payload: null
      });
    },
    loginWithEmail: async email => {
      try {
        localStorage.setItem(E_MAIL_ADDRESS, JSON.stringify(email));
        const res = await axios.post(`${configs.SERVER_URL}/login?email=${email}`);
        dispatch({
          type: "LOGIN_WITH_EMAIL",
          payload: res.status
        });
        console.log(res.status);
      } catch (error) {
        console.error(error);
      }
    },
    confirmLogin: async (email, code) => {
      try {
        const data = email ? email : localStorage.getItem(E_MAIL_ADDRESS);
        const res = await axios.post(`${configs.SERVER_URL}/login?email=${data}&code=${code}`);
        localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify({ address: res.data.addr }));
        localStorage.setItem(LOCAL_ACCESS_TOKEN, JSON.stringify(res.data.token));
        dispatch({
          type: "LOGIN_WITH_E_MAIL",
          payload: res.data
        });
      } catch (error) {
        console.error(error);
      }
    }
  };

  return <GlobalContext.Provider value={authAction}>{children}</GlobalContext.Provider>;
};
