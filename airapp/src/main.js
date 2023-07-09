import moment from "moment/min/moment-with-locales";
import { createApp } from "vue";
import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";

import "./style.css";
import App from "./App.vue";

const app = createApp(App);

moment.updateLocale('en', {
    week: {
        dow: 1,
    },
});

app.component("VueDatePicker", VueDatePicker);

app.mount("#app");
