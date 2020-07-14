<template>
  <v-app class="my-0">
    <v-navigation-drawer color="primary" dark permanent app>
      <v-list nav class="py-0 text-start">
        <v-list-item two-line class="px-0">
          <v-list-item-avatar>
            <img src="./assets/okchain.jpg" />
          </v-list-item-avatar>
          <v-list-item-content>
            <template v-if="identity">
              <v-list-item-title class="title">OKChain</v-list-item-title>
              <v-list-item-subtitle>{{identity.account}}</v-list-item-subtitle>
            </template>
            <template v-else>
              <v-list-item-action>
                <v-btn color="success" small @click="login">login</v-btn>
              </v-list-item-action>
            </template>
          </v-list-item-content>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item-group>
          <v-list-item v-for="tab in tabs" :key="tab.title" link @click="tabClick(tab)">
            <v-list-item-icon>
              <v-icon>{{ tab.icon }}</v-icon>
            </v-list-item-icon>

            <v-list-item-content>
              <v-list-item-title>{{ tab.title }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
      <template v-slot:append>
        <div class="pa-2" v-if="identity">
          <v-btn block color="error" @click="logout">Logout</v-btn>
        </div>
      </template>
    </v-navigation-drawer>
    <v-main>
      <v-container fluid>
        <router-view></router-view>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { RouteNames } from "./router/router";
import { mapActions, mapGetters, mapState } from "vuex";
import * as Actions from "./store/constants";

export default {
  name: "App",
  data() {
    return {
      tabs: [
        {
          index: 0,
          title: "Transfer",
          icon: "mdi-cached",
          name: RouteNames.TRANSFER
        },
        {
          index: 1,
          title: "Orders",
          icon: "mdi-alarm",
          name: RouteNames.ORDERS
        }
      ],
      network: {
        blockchain: "okchain",
        chainId: "okchain"
      },
      identity: null
    };
  },
  methods: {
    login() {
      window.mathExtension.getIdentity(this.network).then(identity => {
        this.identity = identity;
        // Set Store
        this[Actions.SET_IDENTITY](identity);
      });
    },
    logout() {
      window.mathExtension.forgetIdentity().then(() => {
        this.identity = null;
        // Reset Store
        this[Actions.SET_IDENTITY](null);
      });
    },
    tabClick(tab) {
      if (this.$route.name != tab.name) {
        this.$router.push({ name: tab.name });
      }
    },
    ...mapActions([Actions.SET_IDENTITY])
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
