import React, { Component, useState } from "react";
import PropTypes from "prop-types";
import Dialog from "../ui/dialogs/Dialog";
import AuthContainer from "./AuthContainer";
import styled from "styled-components";
import Metamask from "../assets/metamask.png"
import Discord from "../assets/discord-dark.png"



const Container = styled.div`
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 60px;
  flex-direction: column 
`;

const MetaButton = styled.div`
background-color: #d4055a;
border: none;
color: white;
padding: 12px 40px;
font-size: 16px;
cursor: pointer;
display: flex;
align-items: center;
justify-content: center;
margin-bottom: 1rem
`

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

export default function LoginWithMeta({ onConfirm, onCancel, onSuccess, ...props }) {
    const [address, setAddress] = useState(false);
    const [loggingIn, setLoggingIn] = useState(false);
    const [loginFrom, setLoginFrom] = useState('');

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

    console.log(address)

    React.useEffect(() => {
        if (address) {
            onCancel()
        }
    }, [address])

    return (
        <Dialog {...props} title="Login" tag="div" onCancel={onCancel}>
            <Container>
                <MetaButton onClick={metaMaskLogin}><img src={Metamask} alt="metamask" width="28px" /><span>MetaMask</span></MetaButton>
                {/* <AuthContainer onSuccess={onSuccess} onChange={this.onChange} /> */}
                <MetaButton><img src={Discord} alt="metamask" width="28px" /><span>Discord</span></MetaButton>
            </Container>
        </Dialog>
    )
}
