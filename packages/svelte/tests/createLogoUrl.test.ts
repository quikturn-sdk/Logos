import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { BASE_URL } from "@quikturn/logos";
import CreateLogoUrlConsumer from "./helpers/CreateLogoUrlConsumer.svelte";
import ProviderWithLogoUrl from "./helpers/ProviderWithLogoUrl.svelte";

describe("createLogoUrl", () => {
  it("returns URL for domain", () => {
    render(CreateLogoUrlConsumer, { domain: "github.com" });
    const url = screen.getByTestId("url").textContent;
    expect(url).toContain(`${BASE_URL}/github.com`);
  });

  it("includes token from props", () => {
    render(CreateLogoUrlConsumer, {
      domain: "github.com",
      token: "qt_abc",
    });
    const url = screen.getByTestId("url").textContent;
    expect(url).toContain("token=qt_abc");
  });

  it("falls back to context token when no prop token provided", () => {
    render(ProviderWithLogoUrl, {
      providerToken: "qt_ctx",
      domain: "github.com",
    });
    const url = screen.getByTestId("url").textContent;
    expect(url).toContain("token=qt_ctx");
  });

  it("props token overrides context token", () => {
    render(ProviderWithLogoUrl, {
      providerToken: "qt_ctx",
      domain: "github.com",
      token: "qt_prop",
    });
    const url = screen.getByTestId("url").textContent;
    expect(url).toContain("token=qt_prop");
    expect(url).not.toContain("qt_ctx");
  });

  it("applies size option", () => {
    render(CreateLogoUrlConsumer, {
      domain: "github.com",
      size: 256,
    });
    const url = screen.getByTestId("url").textContent;
    expect(url).toContain("size=256");
  });

  it("applies format option", () => {
    render(CreateLogoUrlConsumer, {
      domain: "github.com",
      format: "webp",
    });
    const url = screen.getByTestId("url").textContent;
    expect(url).toContain("format=webp");
  });

  it("applies greyscale option", () => {
    render(CreateLogoUrlConsumer, {
      domain: "github.com",
      greyscale: true,
    });
    const url = screen.getByTestId("url").textContent;
    expect(url).toContain("greyscale=1");
  });

  it("applies theme option", () => {
    render(CreateLogoUrlConsumer, {
      domain: "github.com",
      theme: "dark",
    });
    const url = screen.getByTestId("url").textContent;
    expect(url).toContain("theme=dark");
  });

  it("applies baseUrl from context", () => {
    render(ProviderWithLogoUrl, {
      providerToken: "qt_t",
      providerBaseUrl: "https://custom.api",
      domain: "github.com",
    });
    const url = screen.getByTestId("url").textContent;
    expect(url).toContain("https://custom.api/github.com");
  });
});
