import React, { Component } from "react";
import configs from "../../configs";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import styled from "styled-components";
import { withApi } from "../contexts/ApiContext";


const StyledNavBar = styled.header`
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px 20px;
  font-size: 1.4em;

  a {
    color: ${props => props.theme.text};
    text-decoration: none;
  }
`;

const IconContainer = styled.div`
  margin-right: 20px;

  a {
    display: block;
  }

  img {
    width: 48px;
    display: block;
  }
`;

const MiddleContainer = styled.div`
  display: flex;
  flex: 1;

  @media (max-width: 600px) {
    display: none;
  }
`;

const NavList = styled.ul`
  display: flex;

  li {
    padding: 0 20px;
  }
`;

const RightContainer = styled.div`
  display: flex;
  justify-content: flex-end;

  @media (max-width: 600px) {
    flex: 1;
  }
`;

class NavBar extends Component {
  static propTypes = {
    api: PropTypes.object.isRequired,
    isAuthenticated: PropTypes.bool.isRequired
  };

  constructor(props) {
    super(props);

    const isAuthenticated = this.props.api.isAuthenticated();
    const user = this.props.api.getAuth();
    this.state = {
      isAuthenticated,
      user: user
    };
  }

  componentWillMount() {
    console.log(this.state.isAuthenticated)
  }

  render() {
    return (
      <StyledNavBar>
        <IconContainer>
          <Link to="/">
            <img src={configs.icon()} alt={configs.name} />
          </Link>
        </IconContainer>
        <MiddleContainer>
          <nav>
            <NavList>
              <li>
                <a href="https://webaverse.com">Webaverse</a>
              </li>
              <li>
                <a href="https://app.webaverse.com/" rel="noopener noreferrer">
                  Play
                </a>
              </li>
            </NavList>
          </nav>
        </MiddleContainer>
        <RightContainer>
          <NavList>
            {this.state.isAuthenticated ? (
              <>
                <li>
                  {typeof this.state.user === "object" ? this.state.user.username : this.state.user}
                </li>
                <li>
                  <a href="#" onClick={() => this.props.api.logout()}>Logout</a>
                </li>
              </>
            ) : (
              <li>
                <a href="/login">Login</a>
              </li>
            )
            }
          </NavList>
        </RightContainer>
      </StyledNavBar>
    );
  }
}

export default withApi(NavBar)
