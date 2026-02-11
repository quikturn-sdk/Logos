import { Component, signal } from "@angular/core";
import {
  QuikturnLogoComponent,
  QuikturnLogoGridComponent,
  QuikturnLogoCarouselComponent,
  LogoUrlPipe,
} from "@quikturn/logos-angular";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    QuikturnLogoComponent,
    QuikturnLogoGridComponent,
    QuikturnLogoCarouselComponent,
    LogoUrlPipe,
  ],
  template: `
    <main style="max-width: 960px; margin: 0 auto; padding: 2rem; font-family: system-ui, sans-serif">
      <h1>Quikturn Logos - Angular Demo</h1>

      <!-- Single logo -->
      <section>
        <h2>Single Logo</h2>
        <quikturn-logo domain="github.com" [size]="64" alt="GitHub logo" />
      </section>

      <!-- Logo with link -->
      <section>
        <h2>Logo with Link</h2>
        <quikturn-logo
          domain="google.com"
          [size]="64"
          href="https://google.com"
          alt="Google logo"
        />
      </section>

      <!-- Logo Grid -->
      <section>
        <h2>Logo Grid</h2>
        <quikturn-logo-grid
          [domains]="gridDomains"
          [columns]="3"
          [gap]="24"
          ariaLabel="Partner logos"
        />
      </section>

      <!-- Logo Carousel -->
      <section>
        <h2>Logo Carousel</h2>
        <quikturn-logo-carousel
          [domains]="carouselDomains"
          [speed]="80"
          [pauseOnHover]="true"
          [fadeOut]="true"
          [logoHeight]="32"
          [gap]="48"
        />
      </section>

      <!-- Pipe usage -->
      <section>
        <h2>Pipe Usage</h2>
        <img [src]="'microsoft.com' | logoUrl" alt="Microsoft logo" style="height: 48px" />
        <img
          [src]="'apple.com' | logoUrl: { size: 128, format: 'webp' }"
          alt="Apple logo"
          style="height: 48px; margin-left: 16px"
        />
      </section>

      <!-- Reactive domain with signal -->
      <section>
        <h2>Reactive Domain</h2>
        <input
          type="text"
          [value]="currentDomain()"
          (input)="currentDomain.set($any($event.target).value)"
          placeholder="Enter a domain..."
          style="padding: 8px; font-size: 1rem; border: 1px solid #ccc; border-radius: 4px"
        />
        <div style="margin-top: 16px">
          <quikturn-logo [domain]="currentDomain()" [size]="64" />
        </div>
      </section>
    </main>
  `,
})
export class AppComponent {
  gridDomains = [
    "github.com",
    "google.com",
    "microsoft.com",
    "apple.com",
    "amazon.com",
    "netflix.com",
  ];

  carouselDomains = [
    "github.com",
    "google.com",
    "microsoft.com",
    "apple.com",
    "amazon.com",
    "netflix.com",
  ];

  currentDomain = signal("github.com");
}
