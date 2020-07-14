import * as Actions from "./constants";

export const mutations = {
    [Actions.SET_IDENTITY]: (state, identity) => (state.identity = identity)
};