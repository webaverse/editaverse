export default (state, action) => {
  switch (action.type) {
    case "USER_LOGIN":
      return { ...state, auth: action.payload };
    case "METAMASK_LOGIN":
      return { ...state, auth: action.payload };
    case "LOGOUT_USER":
      return { ...state, auth: action.payload };
    case "LOGIN_WITH_EMAIL":
      return { ...state, resEmail: action.payload };
    case "LOGIN_WITH_E_MAIL":
      return { ...state, auth: action.payload };
    default:
      return state;
  }
};
