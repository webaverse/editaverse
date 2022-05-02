import React, { createContext, useReducer } from "react";
import AppReducer from "./AppReducer";
import axios from "axios";
import configs from "../../configs";
const LOCAL_STORE_KEY = "___hubs_store";
const LOCAL_ACCESS_TOKEN = "access_token";

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
  auth: getAuth()
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
    logout: () => {
      localStorage.removeItem(LOCAL_STORE_KEY);
      localStorage.removeItem(LOCAL_ACCESS_TOKEN);
      dispatch({
        type: "LOGOUT_USER",
        payload: null
      });
    }
  };

  return <GlobalContext.Provider value={authAction}>{children}</GlobalContext.Provider>;
};
