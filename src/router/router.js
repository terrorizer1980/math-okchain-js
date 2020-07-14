import VueRouter from 'vue-router';
import Vue from 'vue';

import Transfer from '../components/Transfer.vue';
import Orders from '../components/Orders.vue';

Vue.use(VueRouter);

export const RouteNames = {
    TRANSFER: "transfer",
    ORDERS: "orders",
};
export default new VueRouter({
    routes: [
        {
            path: "/transfer",
            name: RouteNames.TRANSFER,
            component: Transfer
        },
        {
            path: "/orders",
            name: RouteNames.ORDERS,
            component: Orders
        }
    ]
});