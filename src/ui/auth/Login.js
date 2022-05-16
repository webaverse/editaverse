import React, { useState, useContext, useEffect } from "react";
import styled from "styled-components";
import Metamask from "../../assets/metamask.png";
import Discord from "../../assets/discord-dark.png";
import configs from "../../configs";
import { withApi } from "../contexts/ApiContext";
import { useHistory } from "react-router-dom";
import { GlobalContext } from "../contexts/GlobalState";

const Container = styled.div`
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;

const MetaButton = styled.div`
  background-color: ${props => props.primary};
  border: none;
  padding: 12px 40px;
  width: 100%;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
`;

const ButtonImage = styled.img`
  margin-right: 5px;
`;

const LinkA = styled.a`
  text-decoration: none;
  width: 100%;
`;

const ButtonLabel = styled.span`
  color: #ffffff;
`;

const Header = styled.h1`
  font-size: 2rem;
  margin-bottom: 1.5rem;
`;

const Span = styled.p`
  font-size: 1rem;
  margin-bottom: 0.6rem;
`;

const InputText = styled.input`
  background-color: rgb(7, 8, 9);
  border-radius: 4px;
  border: 1px solid rgb(93, 100, 108);
  color: rgb(255, 255, 255);
  font-size: 20px;
  padding: 8px;
  height: 36px;
  margin-bottom: 1rem;
  width: 100%;
  margin-top: 0.5rem;
`;

const Divider = styled.div`
  width: 100%;
  display: block;
  height: 1px;
  background-color: rgb(93, 100, 108);
  margin-bottom: 1rem;
`;

const LoginWithMeta = () => {
  const [loggingIn, setLoggingIn] = useState(false);
  const history = useHistory();
  const context = useContext(GlobalContext);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const metaMaskLogin = async event => {
    event.preventDefault();
    event.stopPropagation();
    if (!loggingIn) {
      setLoggingIn(true);
      await context.metaMaskLogin();
      history.push("/projects");
    }
  };

  //Close model automatically
  // useEffect(() => {
  //     if (address && onCancel) {
  //         onCancel()
  //     }
  // }, [address])

  const handleLogin = async () => {
    await context.loginWithEmail(email);
  };

  const confirmCode = async () => {
    await context.confirmLogin(email, code);
  };

  //Close model automatically
  useEffect(() => {
    if (context.auth) {
      history.push("/projects");
    }
  }, [context.auth]);

  return (
    <Container>
      <Header>Register or Login</Header>
      <Span>Login to save projects and publish scenes to Webaverse</Span>
      {context.resEmail !== 200 ? (
        <>
          <InputText type={"email"} placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <MetaButton primary="rgb(0, 110, 255)" onClick={handleLogin}>
            Login with E-mail
          </MetaButton>
        </>
      ) : (
        <>
          <InputText type={"code"} placeholder="Code" value={code} onChange={e => setCode(e.target.value)} />
          <MetaButton primary="rgb(0, 110, 255)" onClick={confirmCode}>
            Confirm code
          </MetaButton>
        </>
      )}

      <Divider></Divider>
      <MetaButton primary="#d4055a" onClick={metaMaskLogin}>
        <ButtonImage src={Metamask} alt="metamask" width="28px" />
        <ButtonLabel>MetaMask</ButtonLabel>
      </MetaButton>
      <LinkA href={configs.DISCORD_AUTHORIZATION_URL}>
        <MetaButton primary="#7289da">
          {" "}
          <ButtonImage src={Discord} alt="metamask" width="28px" />
          <ButtonLabel>Discord</ButtonLabel>
        </MetaButton>
      </LinkA>
    </Container>
  );
};

export default withApi(LoginWithMeta);
