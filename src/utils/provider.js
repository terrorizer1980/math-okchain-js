import axios from "axios";

export default class RPCProvider {
    constructor(baseURL) {
        this.client = axios.create({ baseURL, timeout: 30000 });
    }

    nodeInfo() {
        return this.reqeust("get", "/node_info").then(response => {
            return response.node_info;
        });
    }

    getBalace(address) {
        return this.reqeust("get", `/accounts/${address}`).then(response => {
            if (response.code == 0) {
                return response.data.currencies;
            } else {
                throw response.msg;
            }
        });
    }
    authAccount(address) {
        return this.reqeust("get", `/auth/accounts/${address}`).then(response => {
            return response.value;
        });
    }

    txs(signedTx) {
        return this.reqeust("post", "/txs?sync=true", signedTx).then(response => {
            console.log(response);
            return response;
        });
    }

    reqeust(method, path, params = {}, opts = {}) {
        const options = {
            method,
            url: path,
            ...opts
        };
        if (params) {
            if (method === "get") {
                options.params = params;
            } else {
                options.data = params;
            }
        }
        return this.client
            .request(options)
            .then(response => {
                if (response.status == 200) {
                    return response.data;
                } else {
                    throw "Invalid rpc url";
                }
            })
            .catch(err => {
                throw err;
            });
    }
}