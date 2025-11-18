// sessions.js

let sessions = {};

function getUserState(phone) {
    return sessions[phone] || { stage: "menu", lastMessage: null };
}

function setUserState(phone, state) {
    sessions[phone] = { ...sessions[phone], ...state };
}

function resetUserState(phone) {
    delete sessions[phone];
}

module.exports = { getUserState, setUserState, resetUserState };
