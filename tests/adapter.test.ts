import { describe, it, expect } from "vitest";
import { getActiveBenefits } from "../src/lib/benefits/registry";
import { benefitToScheme } from "../src/lib/benefits/adapter";

describe("benefitToScheme adapter", () => {
  const benefits = getActiveBenefits();

  it("preserves id and slug (no ID churn)", () => {
    for (const b of benefits) {
      const s = benefitToScheme(b);
      expect(s.id).toBe(b.id);
      expect(s.slug).toBe(b.slug);
    }
  });

  it("carries status and a source URL", () => {
    for (const b of benefits) {
      const s = benefitToScheme(b);
      expect(s.status).toBe(b.status);
      expect(s.sourceUrl).toBeTruthy();
    }
  });

  it("maps document keys back to DocumentKey[]", () => {
    const withDocs = benefits.find((b) => (b.documents ?? []).some((d) => d.key));
    expect(withDocs).toBeDefined();
    const s = benefitToScheme(withDocs!);
    expect(s.documents.length).toBeGreaterThan(0);
  });
});
