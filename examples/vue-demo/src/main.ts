import { createApp } from "vue";
import { QuikturnPlugin } from "@quikturn/logos-vue";
import App from "./App.vue";

const app = createApp(App);

app.use(QuikturnPlugin, { token: "" });

app.mount("#app");
