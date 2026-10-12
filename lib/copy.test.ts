import { describe, expect, it } from "vitest";
import { fixFoodSafetyTypo, presentCourseCopy } from "./copy";

describe("fixFoodSafetyTypo", () => {
  it("corrects the ISO 22000 course description", () => {
    expect(fixFoodSafetyTypo("Food Safty Management Systems Limited")).toBe(
      "Food Safety Management Systems Limited",
    );
  });

  it("preserves capitalisation", () => {
    expect(fixFoodSafetyTypo("FOOD SAFTY MANAGEMENT SYSTEMS")).toBe(
      "FOOD SAFETY MANAGEMENT SYSTEMS",
    );
    expect(fixFoodSafetyTypo("food safty")).toBe("food safety");
  });

  it("leaves correct copy alone", () => {
    expect(fixFoodSafetyTypo("Food Safety Management Systems")).toBe(
      "Food Safety Management Systems",
    );
  });
});

describe("presentCourseCopy", () => {
  it("corrects description without changing a clean title", () => {
    const course = presentCourseCopy({
      id: "1",
      title: "ISO 22000: Lead Auditor",
      standard: "ISO 22000",
      description: "Food Safty Management Systems Limited",
    });
    expect(course.title).toBe("ISO 22000: Lead Auditor");
    expect(course.description).toBe("Food Safety Management Systems Limited");
    expect(course.id).toBe("1");
  });
});
