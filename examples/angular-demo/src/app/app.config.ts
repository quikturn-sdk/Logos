import { ApplicationConfig } from "@angular/core";
import { provideQuikturnLogos } from "@quikturn/logos-angular";

export const appConfig: ApplicationConfig = {
  providers: [
    provideQuikturnLogos({ token: "qt_demo_key" }),
  ],
};
