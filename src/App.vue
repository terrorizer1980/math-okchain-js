<template>
  <v-app>
    <v-content>
      <v-container fluid>
        <v-card class="mx-auto">
          <v-card-title>{{account?account.account:"Open MathWallet"}}</v-card-title>
          <v-card-actions>
            <v-btn class="primary" @click="login" v-if="!account">Log in</v-btn>
            <v-btn class="warning" @click="logout" v-else>Log out</v-btn>
          </v-card-actions>
        </v-card>

        <v-card light class="mt-2" v-if="account">
          <v-card-title>Signature</v-card-title>
          <v-card-subtitle>{{signature?JSON.stringify(signature):""}}</v-card-subtitle>
          <v-card-actions>
            <v-btn class="success" @click="requestSignature">Signature</v-btn>
          </v-card-actions>
        </v-card>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      network: {
        blockchain: "okchain",
        chainId: "okchain"
      },
      account: null,
      signature: null
    };
  },
  methods: {
    login() {
      window.mathExtension.getIdentity(this.network).then(account => {
        this.account = account;
      });
    },
    logout() {
      window.mathExtension.forgetIdentity().then(() => {
        this.account = null;
      });
    },
    requestSignature() {
      const transaction = {
        account_number: "2741",
        chain_id: "okchain",
        fee: {
          amount: [
            {
              amount: "0.00200000",
              denom: "tokt"
            }
          ],
          gas: "200000"
        },
        memo: "",
        msgs: [
          {
            type: "okchain/token/MsgTransfer",
            value: {
              amount: [
                {
                  amount: "1.00000000",
                  denom: "okb"
                }
              ],
              from_address: "okchain1g7c3nvac7mjgn2m9mqllgat8wwd3aptdqket5k",
              to_address: "okchain1t2cvfv58764q4wdly7qjx5d2z89lewvwq2448n"
            }
          }
        ],
        sequence: "27"
      };
      // 请求插件签名
      window.mathExtension
        .requestSignature(transaction, this.network)
        .then(signatrue => {
          this.signature = signatrue;
        })
        .catch(e => {
          console.log(e);
        });
    }
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
