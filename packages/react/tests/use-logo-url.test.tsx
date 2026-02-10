import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useLogoUrl } from "../src/use-logo-url";
import { QuikturnProvider } from "../src/context";
import { BASE_URL } from "@quikturn/logos";

describe("useLogoUrl", () => {
  it("returns URL for domain", () => {
    const { result } = renderHook(() => useLogoUrl("github.com"));
    expect(result.current).toContain(`${BASE_URL}/github.com`);
  });

  it("includes token from props", () => {
    const { result } = renderHook(() =>
      useLogoUrl("github.com", { token: "qt_abc" }),
    );
    expect(result.current).toContain("token=qt_abc");
  });

  it("falls back to context token", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QuikturnProvider token="qt_ctx">{children}</QuikturnProvider>
    );
    const { result } = renderHook(() => useLogoUrl("github.com"), { wrapper });
    expect(result.current).toContain("token=qt_ctx");
  });

  it("props token overrides context token", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QuikturnProvider token="qt_ctx">{children}</QuikturnProvider>
    );
    const { result } = renderHook(
      () => useLogoUrl("github.com", { token: "qt_prop" }),
      { wrapper },
    );
    expect(result.current).toContain("token=qt_prop");
    expect(result.current).not.toContain("qt_ctx");
  });

  it("applies size option", () => {
    const { result } = renderHook(() =>
      useLogoUrl("github.com", { size: 256 }),
    );
    expect(result.current).toContain("size=256");
  });

  it("applies format option", () => {
    const { result } = renderHook(() =>
      useLogoUrl("github.com", { format: "webp" }),
    );
    expect(result.current).toContain("format=webp");
  });

  it("applies greyscale option", () => {
    const { result } = renderHook(() =>
      useLogoUrl("github.com", { greyscale: true }),
    );
    expect(result.current).toContain("greyscale=1");
  });

  it("applies theme option", () => {
    const { result } = renderHook(() =>
      useLogoUrl("github.com", { theme: "dark" }),
    );
    expect(result.current).toContain("theme=dark");
  });

  it("applies baseUrl from context", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QuikturnProvider token="qt_t" baseUrl="https://custom.api">
        {children}
      </QuikturnProvider>
    );
    const { result } = renderHook(() => useLogoUrl("github.com"), { wrapper });
    expect(result.current).toContain("https://custom.api/github.com");
  });
});
