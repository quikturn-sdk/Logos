import {
  InjectionToken,
  makeEnvironmentProviders,
  type EnvironmentProviders,
} from "@angular/core";
import type { QuikturnConfig } from "./types";

/** Injection token for the Quikturn configuration. */
export const QUIKTURN_CONFIG = new InjectionToken<QuikturnConfig>(
  "QUIKTURN_CONFIG",
);

/** Provides Quikturn configuration to the Angular DI system. */
export function provideQuikturnLogos(
  config: QuikturnConfig,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: QUIKTURN_CONFIG, useValue: config },
  ]);
}
