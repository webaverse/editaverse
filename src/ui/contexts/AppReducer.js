export default (state, action) => {
    switch (action.type) {
        case 'USER_LOGIN':
            return { ...state, auth: action.payload }
        case 'METAMASK_LOGIN':
            return { ...state, auth: action.payload }
        case 'LOGOUT_USER':
            return { ...state, auth: action.payload }
        default:
            return state;
    }
}