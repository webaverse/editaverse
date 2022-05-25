import React, { Component } from "react";
import PropTypes from "prop-types";
import Dialog from "../ui/dialogs/Dialog";
import Login from "../ui/auth/Login";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 60px;
`;

export default class LoginDialog extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
  };

  static defaultProps = {
    title: "Login"
  };

  state = {
    showCancel: true
  };

  onChange = ({ emailSent }) => {
    this.setState({ showCancel: !emailSent });
  };

  render() {
    const { onConfirm, onCancel, onSuccess, ...props } = this.props;

    return (
      <Dialog {...props} tag="div" onCancel={this.state.showCancel ? onCancel : null}>
        <Container>
          <Login />
        </Container>
      </Dialog>
    );
  }
}
