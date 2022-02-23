import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import inputMixin from "../inputs/inputMixin";

const SearchInputContainer = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: flex-end;

  a {
    color: ${props => props.theme.text};
  }

  input {
    ${inputMixin}
    margin-right: 8px;
    display: flex;
    flex: 1;
    max-width: 300px;
  }
`;

const LegalContainer = styled.div`
  display: flex;
  white-space: nowrap;
  text-indent: 0.5em;
`;

export default function AssetSearchInput({ legal, onChange, ...rest }) {
  return (
    <SearchInputContainer>
      <input placeholder="Search..." onChange={onChange} {...rest} />
      {legal && <LegalContainer>{legal}</LegalContainer>}
    </SearchInputContainer>
  );
}

AssetSearchInput.propTypes = {
  onChange: PropTypes.func,
  legal: PropTypes.string
};
