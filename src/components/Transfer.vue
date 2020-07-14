<template>
  <v-card class="mx-auto" v-if="identity">
    <v-card-text>
      <v-select :items="items" v-model="selectedItem" label="Select A Token" return-object filled></v-select>
      <v-text-field
        v-model="recipient"
        label="recipient"
        placeholder="okchain1g7c3nvac7mjgn2m9mqllgat8wwd3aptdqket5k"
        filled
      ></v-text-field>
      <v-text-field
        v-model="amount"
        label="Amount"
        :hint="selectedItem?`Available ${selectedItem.value}`:''"
        placeholder="0"
        persistent-hint
        filled
      ></v-text-field>
    </v-card-text>
    <v-card-actions class="mx-2">
      <v-spacer />
      <v-btn color="primary" block @click="transfer()">Send</v-btn>
      <v-spacer />
    </v-card-actions>
    <v-snackbar
      v-model="showSnackbar"
      :timeout="snackbarTimeout"
      :color="snackbarColor"
      top
    >{{ snackbarText }}</v-snackbar>
  </v-card>
  <h2 v-else>Please login first</h2>
</template>

<script>
import RPCProvider from "../utils/provider";
import { mapActions, mapGetters, mapState } from "vuex";

export default {
  name: "Transfer",
  data() {
    return {
      showSnackbar: false,
      snackbarText: "",
      snackbarColor: "success",
      snackbarTimeout: 2000,
      rpcURL: "https://okex.maiziqianbao.net/okchain/v1",
      provider: null,
      items: [],
      selectedItem: null,
      recipient: "okchain1223de5pg4sx7lrmmj7ylc9c4gcep7nf5k502rv",
      amount: "1.00000000"
    };
  },
  computed: {
    ...mapState(["identity"])
  },
  watch: {
    identity(value) {
      // Balance
      this.getBalance();
    }
  },
  mounted() {
    // RPC Provider
    this.provider = new RPCProvider(this.rpcURL);
    // Balance
    if (this.identity) {
      this.getBalance();
    }
  },
  methods: {
    getBalance() {
      this.provider
        .getBalace(this.identity.account)
        .then(tokens => {
          this.items = tokens.map(token => {
            return { text: token.symbol, value: token.available };
          });
          this.selectedItem = this.items.length > 0 ? this.items[0] : null;
        })
        .catch(e => {
          this.showSnackbar = true;
          this.snackbarText = e.message || "Unknow error";
          this.snackbarColor = "error";
        });
    },
    async createTransaction(address, recipient, denom, amount) {
      const nodeInfo = await this.provider.nodeInfo();
      const authAccount = await this.provider.authAccount(address);

      return {
        sequence: authAccount.sequence,
        account_number: authAccount.account_number,
        chain_id: nodeInfo.network,
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
                  amount: amount,
                  denom: denom
                }
              ],
              from_address: address,
              to_address: recipient
            }
          }
        ]
      };
    },
    async sendTransaction(transaction, signature) {
      const signedTx = {
        tx: {
          msg: transaction.msgs,
          signatures: [signature],
          memo: transaction.memo,
          fee: transaction.fee
        },
        mode: "block"
      };
      return await this.provider.txs(signedTx);
    },
    transfer() {
      // Check
      if (this.recipient.length < 46) {
        this.showSnackbar = true;
        this.snackbarText = "Please enter recipient";
        this.snackbarColor = "error";
        return;
      }
      if (this.amount.length < 1) {
        this.showSnackbar = true;
        this.snackbarText = "Please enter amount";
        this.snackbarColor = "error";
        return;
      }
      // Transaction
      this.createTransaction(
        this.identity.account,
        this.recipient,
        this.selectedItem.text,
        this.amount
      )
        .then(transaction => {
          // Signature & Send
          window.mathExtension
            .requestSignature(transaction)
            .then(signatrue => {
              this.sendTransaction(transaction, signatrue)
                .then(res => {
                  this.showSnackbar = true;
                  this.snackbarText = "Success";
                  this.snackbarColor = "success";
                })
                .catch(e => {
                  this.showSnackbar = true;
                  this.snackbarText = e.message || "Unknow error";
                  this.snackbarColor = "error";
                });
            })
            .catch(e => {
              this.showSnackbar = true;
              this.snackbarText = e.message || "Unknow error";
              this.snackbarColor = "error";
            });
        })
        .catch(e => {
          this.showSnackbar = true;
          this.snackbarText = e.message || "Unknow error";
          this.snackbarColor = "error";
        });
    }
  }
};
</script>

<style>
</style>