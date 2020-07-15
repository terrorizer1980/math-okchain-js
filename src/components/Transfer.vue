<template>
  <v-card class="mx-auto" :disabled="!identity">
    <v-card-text>
      <v-select :items="tokens" v-model="selectedToken" label="Select A Token" return-object filled></v-select>
      <v-text-field
        v-model="recipient"
        label="recipient"
        placeholder="okchain1g7c3nvac7mjgn2m9mqllgat8wwd3aptdqket5k"
        filled
      ></v-text-field>
      <v-text-field
        v-model="amount"
        label="Amount"
        :hint="selectedToken?`Available ${selectedToken.value}`:''"
        placeholder="0"
        persistent-hint
        filled
      ></v-text-field>
    </v-card-text>
    <v-card-actions class="mx-2">
      <v-spacer />
      <v-btn
        color="primary"
        block
        @click="transfer()"
        :disabled="!identity"
      >{{identity?"Send":"Please login first"}}</v-btn>
      <v-spacer />
    </v-card-actions>
    <v-snackbar
      v-model="showSnackbar"
      :timeout="snackbarTimeout"
      :color="snackbarColor"
      top
    >{{ snackbarText }}</v-snackbar>
    <v-overlay :value="processing">
      <v-progress-circular indeterminate size="64"></v-progress-circular>
    </v-overlay>
  </v-card>
</template>

<script>
import RPCProvider from "../utils/provider";
import { mapActions, mapGetters, mapState } from "vuex";
import { parseAmount, formatAmount } from "../utils/Format";

export default {
  name: "Transfer",
  data() {
    return {
      processing: false,
      showSnackbar: false,
      snackbarText: "",
      snackbarColor: "success",
      snackbarTimeout: 2000,
      rpcURL: "https://okex.maiziqianbao.net/okchain/v1",
      provider: null,
      tokens: [
        { text: "tokt", value: "0", decimal: 8 },
        { text: "tokb", value: "0", decimal: 8 },
        { text: "tbtc", value: "0", decimal: 8 },
        { text: "tusdk", value: "0", decimal: 8 }
      ],
      selectedToken: null,
      recipient: "",
      amount: ""
    };
  },
  computed: {
    ...mapState(["identity"])
  },
  watch: {
    identity(newIdentity) {
      // Balance
      this.getBalance();
    }
  },
  mounted() {
    // RPC Provider
    this.provider = new RPCProvider(this.rpcURL);
    // Token
    this.selectedToken = this.tokens[0];
    // Balance
    this.getBalance();
    setInterval(() => {
      this.getBalance();
    }, 6000);
  },
  methods: {
    getBalance() {
      if (!this.identity) return;
      this.provider
        .getBalace(this.identity.account)
        .then(tokens => {
          this.tokens = this.tokens.map(token => {
            let t = tokens.find(t => t.symbol === token.text);
            if (t) {
              token.value = t.available;
            }
            return token;
          });
          this.selectedToken = this.tokens.find(
            t => t.text === this.selectedToken.text
          );
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
      this.processing = true;
      this.createTransaction(
        this.identity.account,
        this.recipient,
        this.selectedToken.text,
        formatAmount(
          parseAmount(this.amount, this.selectedToken.decimal),
          this.selectedToken.decimal
        )
      )
        .then(transaction => {
          // Signature & Send
          window.mathExtension
            .requestSignature(transaction)
            .then(signatrue => {
              this.sendTransaction(transaction, signatrue)
                .then(res => {
                  this.processing = false;
                  this.showSnackbar = true;
                  this.snackbarText = "Success";
                  this.snackbarColor = "success";
                })
                .catch(e => {
                  this.processing = false;
                  this.showSnackbar = true;
                  this.snackbarText = e.message || "Unknow error";
                  this.snackbarColor = "error";
                });
            })
            .catch(e => {
              this.processing = false;
              this.showSnackbar = true;
              this.snackbarText = e.message || "Unknow error";
              this.snackbarColor = "error";
            });
        })
        .catch(e => {
          this.processing = false;
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