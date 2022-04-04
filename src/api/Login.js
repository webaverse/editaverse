import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Metamask from "../assets/metamask.png"
import Discord from "../assets/discord-dark.png"
import configs from "../configs";
import { withApi } from "../ui/contexts/ApiContext";
import { useHistory } from "react-router-dom"

const Container = styled.div`
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 60px;
  flex-direction: column 
`;

const MetaButton = styled.div`
background-color: ${props => props.primary};
border: none;
color: white;
padding: 12px 40px;
width: 30vh;
font-size: 16px;
cursor: pointer;
display: flex;
align-items: center;
justify-content: center;
margin-bottom: 1rem
`

const LinkA = styled.a`
text-decoration: none  
`
const LOCAL_STORE_KEY = "___hubs_store";

const LoginWithMeta = ({ onConfirm, onCancel, onSuccess, ...props }) => {
    const [address, setAddress] = useState(false);
    const [loggingIn, setLoggingIn] = useState(false);
    const [loginFrom, setLoginFrom] = useState('');
    const history = useHistory();

    const getMainnetAddress = async () => {
        if (typeof window !== "undefined" && window.ethereum) {
            const [address] = await window.ethereum.request({
                method: 'eth_requestAccounts',
            });
            localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(address));
            return address || null;
        } else {
            return null;
        }
    };

    const metaMaskLogin = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!loggingIn) {
            setLoggingIn(true);
            try {
                const addressWallet = await getMainnetAddress();
                setAddress(addressWallet);
                history.push('/projects')
                setLoginFrom('metamask');
                setLoginFrom('metamask');
            } catch (err) {
                console.warn(err);
            } finally {
                setLoggingIn(false);
            }
        }
    };

    //Close model automatically 
    // useEffect(() => {
    //     if (address && onCancel) {
    //         onCancel()
    //     }
    // }, [address])



    return (
        <Container>
            <MetaButton primary="#d4055a" onClick={metaMaskLogin}><img src={Metamask} alt="metamask" width="28px" /><span>MetaMask</span></MetaButton>
            <LinkA href={configs.DISCORD_AUTHORIZATION_URL}><MetaButton primary="#7289da"> <img src={Discord} alt="metamask" width="28px" />Discord</MetaButton></LinkA>
        </Container>
    )
}


export default withApi(LoginWithMeta); 