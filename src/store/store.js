import Vue from "vue";
import Vuex from "vuex";

import { mutations } from "./mutations";
import { actions } from "./actions";

Vue.use(Vuex);

const state = {
    identity: null
};
const getters = {};

export default new Vuex.Store({
    state,
    getters,
    mutations,
    actions
});
