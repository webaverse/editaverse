import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Metamask from "../assets/metamask.png"
import Discord from "../assets/discord-dark.png"
import configs from "../configs";

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

export default function LoginWithMeta({ onConfirm, onCancel, onSuccess, ...props }) {
    const [address, setAddress] = useState(false);
    const [loggingIn, setLoggingIn] = useState(false);
    const [loginFrom, setLoginFrom] = useState('');


    const getMainnetAddress = async () => {
        if (typeof window !== "undefined" && window.ethereum) {
            const [address] = await window.ethereum.request({
                method: 'eth_requestAccounts',
            });
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
                setLoginFrom('metamask');
                setShow(false);
                setLoginFrom('metamask');
            } catch (err) {
                console.warn(err);
            } finally {
                setLoggingIn(false);
            }
        }
    };

    useEffect(() => {
        if (address) {
            onCancel()
        }
    }, [address])



    return (
        <Container>
            <MetaButton primary="#d4055a" onClick={metaMaskLogin}><img src={Metamask} alt="metamask" width="28px" /><span>MetaMask</span></MetaButton>
            <MetaButton primary="#7289da"> <a href={configs.DISCORD_AUTHORIZATION_URL}><img src={Discord} alt="metamask" width="28px" /><span>Discord</span></a></MetaButton>
        </Container>
    )
}
