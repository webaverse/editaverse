import React, { Component } from "react";
import styled from "styled-components";
import PropTypes from "prop-types";

const StyledLoader = styled.div`
  height: ${props => props.size}px;
  width: ${props => props.size}px;
  display: block;
  margin: auto;
  position: sticky;
`;

const StyledLoaderSpan = styled.span`
  display: block;
  position: absolute;
  margin: auto;
  height: ${props => props.size}px;
  width: ${props => props.size}px;

  &::before,
  &::after {
    content: "";
    display: block;
    position: absolute;
    margin: auto;
    height: ${props => props.size}px;
    width: ${props => props.size}px;
    border: 2px solid white;
    border-radius: 50%;
    opacity: 0;
    -webkit-animation: loader-frame-1 1.5s cubic-bezier(0.075, 0.82, 0.165, 1) infinite;
    animation: loader-frame-1 1.5s cubic-bezier(0.075, 0.82, 0.165, 1) infinite;
  }

  @-webkit-keyframes loader-frame-1 {
    0% {
      -webkit-transform: translate3d(0, 0, 0) scale(0);
      opacity: 1;
    }
    100% {
      -webkit-transform: translate3d(0, 0, 0) scale(0.5);
      opacity: 0;
    }
  }

  @keyframes loader-frame-1 {
    0% {
      transform: translate3d(0, 0, 0) scale(0);
      opacity: 1;
    }
    100% {
      transform: translate3d(0, 0, 0) scale(0.5);
      opacity: 0;
    }
  }
  &::after {
    -webkit-animation: loader-frame-2 1.5s cubic-bezier(0.075, 0.82, 0.165, 1) 0.25s infinite;
    animation: loader-frame-2 1.5s cubic-bezier(0.075, 0.82, 0.165, 1) 0.25s infinite;
  }
  @-webkit-keyframes loader-frame-2 {
    0% {
      -webkit-transform: translate3d(0, 0, 0) scale(0);
      opacity: 1;
    }
    100% {
      -webkit-transform: translate3d(0, 0, 0) scale(1);
      opacity: 0;
    }
  }

  @keyframes loader-frame-2 {
    0% {
      transform: translate3d(0, 0, 0) scale(0);
      opacity: 1;
    }
    100% {
      transform: translate3d(0, 0, 0) scale(1);
      opacity: 0;
    }
  }
`;
export default class Loader extends Component {
  static propTypes = {
    size: PropTypes.number.isRequired
  };

  render() {
    return (
      <StyledLoader size={this.props.size}>
        <StyledLoaderSpan size={this.props.size}></StyledLoaderSpan>
      </StyledLoader>
    );
  }
}
