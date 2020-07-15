<template>
  <v-card class="mx-auto" :disabled="!identity">
    <v-card-text>
      <v-select
        :items="tradingPairs"
        v-model="selectedTradingPair"
        item-text="tradingPair"
        label="Select A Trading Pair"
        return-object
        filled
      ></v-select>
      <v-row dense>
        <v-col cols="2" color="grey" class="align-start">Quantity</v-col>
        <v-col
          cols="8"
          color="grey"
        >Price{{selectedTradingPair?`(${selectedTradingPair.quote_asset_symbol})`:""}}</v-col>
        <v-col cols="2" color="grey">Quantity</v-col>
      </v-row>
      <v-row dense>
        <v-col cols="6" color="grey">
          <v-virtual-scroll :items="marketBids" item-height="24" height="132">
            <template v-slot="{ item }">
              <v-list-item class="grey lighten-4 caption" dense>
                <strong>{{item.quantity}}</strong>
                <v-spacer />
                <strong class="green--text">{{item.price}}</strong>
              </v-list-item>
            </template>
          </v-virtual-scroll>
        </v-col>
        <v-col cols="6">
          <v-virtual-scroll :items="marketAsks" item-height="24" height="132">
            <template v-slot="{ item }">
              <v-list-item class="grey lighten-4 caption" dense>
                <strong class="red--text">{{item.price}}</strong>
                <v-spacer />
                <strong>{{item.quantity}}</strong>
              </v-list-item>
            </template>
          </v-virtual-scroll>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <v-btn-toggle v-model="side" color="primary" dense>
            <v-btn value="BUY" class="success--text" dense>
              <span class="hidden-sm-and-down">Buy</span>
            </v-btn>

            <v-btn value="SELL" class="red--text" dense>
              <span class="hidden-sm-and-down">Sell</span>
            </v-btn>
          </v-btn-toggle>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <v-text-field
            placeholder="0.00000000"
            label="Price"
            v-model="price"
            :suffix="selectedTradingPair?selectedTradingPair.quote_asset_symbol:''"
            filled
            dense
          ></v-text-field>
          <v-text-field
            placeholder="0.00000000"
            label="Amount"
            v-model="amount"
            :suffix="selectedTradingPair?selectedTradingPair.base_asset_symbol:''"
            filled
            dense
            :hint="`available ${available}`"
            persistent-hint
          ></v-text-field>
          <template v-if="side === 'BUY'">
            <v-btn
              color="success"
              block
              @click="createOrder()"
              :disabled="!identity"
            >{{identity?"Buy":"Please login first"}}</v-btn>
          </template>
          <template v-else>
            <v-btn
              color="error"
              block
              @click="createOrder()"
              :disabled="!identity"
            >{{identity?"Sell":"Please login first"}}</v-btn>
          </template>
        </v-col>
      </v-row>
    </v-card-text>
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
  name: "Orders",
  computed: {
    ...mapState(["identity"])
  },
  watch: {
    side(newSide) {
      if (newSide === "BUY") {
        this.price = this.marketAsks.length ? this.marketAsks[0].price : "";
      } else {
        this.price = this.marketBids.length ? this.marketBids[0].price : "";
      }
      this.amount = "";
      // Trading Available
      this.available = this.getTradingAvailable();
    },
    selectedTradingPair(tradingPair) {
      // Balance
      this.getBalance();
      // Market depth
      this.getMarketDepthBook(tradingPair);
      // Trading Available
      this.available = this.getTradingAvailable();
    },
    tokens(newTokens) {
      // Trading Available
      this.available = this.getTradingAvailable();
    },
    identity(newIdentity) {
      this.getBalance();
    }
  },
  data() {
    return {
      processing: false,
      showSnackbar: false,
      snackbarText: "",
      snackbarColor: "success",
      snackbarTimeout: 2000,
      rpcURL: "https://okex.maiziqianbao.net/okchain/v1",
      provider: null,
      // tokens
      tokens: [],
      // market
      tradingPairs: [],
      selectedTradingPair: null,
      marketAsks: [],
      marketBids: [],
      // Order
      side: "BUY",
      amount: "",
      price: "",
      available: "0"
    };
  },
  mounted() {
    // RPC Provider
    this.provider = new RPCProvider(this.rpcURL);
    // TradingParis
    this.getTradingPairs();
    setInterval(() => {
      if (this.selectedTradingPair) {
        this.getMarketDepthBook(this.selectedTradingPair);
        this.getBalance();
      }
    }, 6000);
  },
  methods: {
    getBalance() {
      if (!this.identity) return;
      this.provider
        .getBalace(this.identity.account)
        .then(tokens => {
          this.tokens = tokens;
        })
        .catch(e => {});
    },
    getTradingAvailable() {
      if (!this.tokens || !this.selectedTradingPair) {
        return "0";
      }
      const symbol =
        this.side === "BUY"
          ? this.selectedTradingPair.quote_asset_symbol
          : this.selectedTradingPair.base_asset_symbol;
      const token = this.tokens.find(token => token.symbol === symbol);
      if (!token) {
        return "0";
      }
      return token.available + " " + token.symbol;
    },
    getTradingPairs() {
      this.provider
        .allTradingPairs()
        .then(tradingPairs => {
          this.tradingPairs = tradingPairs.map(tp => {
            return {
              tradingPair: `${tp.base_asset_symbol}_${tp.quote_asset_symbol}`,
              ...tp
            };
          });
          this.selectedTradingPair = this.tradingPairs[0];
        })
        .catch(e => {});
    },
    getMarketDepthBook(tradingPair) {
      this.provider
        .marketDepthBook(tradingPair.tradingPair)
        .then(book => {
          this.marketAsks = book.asks || [];
          this.marketBids = book.bids || [];
          // Default(BUY)
          this.price = this.marketAsks.length ? this.marketAsks[0].price : "";
        })
        .catch(e => {});
    },
    async createTransaction(product, side, price, amount, address) {
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
            type: "okchain/order/MsgNew",
            value: {
              order_items: [
                {
                  price: price,
                  product: product,
                  quantity: amount,
                  side: side
                }
              ],
              sender: address
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
    createOrder() {
      // Check
      if (this.price.length < 1) {
        this.showSnackbar = true;
        this.snackbarText = "Please enter price";
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
        this.selectedTradingPair.tradingPair,
        this.side,
        formatAmount(parseAmount(this.price, 8), 8),
        formatAmount(parseAmount(this.amount, 8), 8),
        this.identity.account
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