import React, { createContext, useReducer } from "react"
import AppReducer from "./AppReducer"
import { MetamaskManager, ProfileManager, DiscordManager } from "webaverse-blockchain-lib/dist"
import axios from "axios";

const LOCAL_STORE_KEY = "___hubs_store";
const LOCAL_ACCESS_TOKEN = "access_token";
const E_MAIL_ADDRESS = 'email_address'

export const getAuth = () => {
    const value = localStorage.getItem(LOCAL_STORE_KEY);

    if (!value) {
        console.error("Not authenticated")
    }

    const store = JSON.parse(value);

    if (!store) {
        console.error("Not authenticated")
    }

    return store;
}

//Initial state 
const initialState = {
    auth: getAuth(),
    resEmail: ""
}

//Create context 
export const GlobalContext = createContext(initialState);

// Provider component 
export const GlobalProvider = ({ children }) => {
    const [state, dispatch] = useReducer(AppReducer, initialState);

    //Actions
    const authAction = {
        auth: state.auth,
        resEmail: state.resEmail,
        metaMaskLogin: async () => {
            const metamask = new MetamaskManager();
            try {
                const signedMessage = await metamask.connect();
                const provider = metamask.getProvider();
                const address = await provider.getSigner().getAddress();
                const jwt = await metamask.login(signedMessage);
                const profile = new ProfileManager(provider);
                const user = await profile.getProfile();
                console.log(user);
                localStorage.setItem(LOCAL_ACCESS_TOKEN, JSON.stringify(jwt))
                localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify({ address: address }));
                dispatch({
                    type: "METAMASK_LOGIN",
                    payload: {
                        address: address
                    }
                })
            } catch (error) {
                console.error(error.toString())
                dispatch({
                    type: "LOGIN_ERROR",
                    payload: {
                        address: null
                    }
                })
            }
        },
        getInfo: async (code) => {
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

        },
        logout: () => {
            localStorage.removeItem(LOCAL_STORE_KEY);
            localStorage.removeItem(LOCAL_ACCESS_TOKEN)
            dispatch({
                type: "LOGOUT_USER",
                payload: null
            })
        },
        loginWithEmail: async (email) => {
            try {
                localStorage.setItem(E_MAIL_ADDRESS, JSON.stringify(email))
                const res = await axios.post(`https://login.webaverse.com?email=${email}`);
                dispatch({
                    type: 'LOGIN_WITH_EMAIL',
                    payload: res.status
                })
                console.log(res.status)
            } catch (error) {
                console.error(error);
            }
        },
        confirmLogin: async (email, code) => {
            try {
                const data = email ? email : localStorage.getItem(E_MAIL_ADDRESS);
                const res = await axios.post(`https://login.webaverse.com?email=${data}&code=${code}`);
                localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify({ address: res.data.addr }));
                localStorage.setItem(LOCAL_ACCESS_TOKEN, JSON.stringify(res.data.token))
                dispatch({
                    type: "LOGIN_WITH_E_MAIL",
                    payload: res.data
                })
            } catch (error) {
                console.error(error);
            }
        }
    }


    return (<GlobalContext.Provider value={authAction}>{children}</GlobalContext.Provider>)
}