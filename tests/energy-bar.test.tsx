import assert from "node:assert/strict";
import test from "node:test";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { EnergyBar } from "../app/components/trip-handbook/energy-bar";

const findElementByClassName = (
  node: ReactNode,
  className: string,
): ReactElement | null => {
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElementByClassName(child, className);
      if (match) return match;
    }

    return null;
  }

  if (!isValidElement<{ children?: ReactNode; className?: string }>(node)) {
    return null;
  }

  if (node.props.className?.split(" ").includes(className)) return node;

  if (typeof node.type === "function") {
    const Component = node.type as (props: unknown) => ReactNode;
    return findElementByClassName(Component(node.props), className);
  }

  return findElementByClassName(node.props.children, className);
};

test("能量條回報 progressbar 語意與目前數值", () => {
  const view = EnergyBar({ percent: 60 });

  assert.equal(view.props.role, "progressbar");
  assert.equal(view.props["aria-valuenow"], 60);
  assert.equal(view.props["aria-valuemin"], 0);
  assert.equal(view.props["aria-valuemax"], 100);
});

test("填色寬度等於 percent 百分比", () => {
  const fill = findElementByClassName(EnergyBar({ percent: 35 }), "energy-bar-fill");

  assert.equal(fill?.props.style?.width, "35%");
});

test("percent 會被夾在 0 到 100 之間", () => {
  const negativeFill = findElementByClassName(
    EnergyBar({ percent: -20 }),
    "energy-bar-fill",
  );
  const overflowFill = findElementByClassName(
    EnergyBar({ percent: 150 }),
    "energy-bar-fill",
  );

  assert.equal(negativeFill?.props.style?.width, "0%");
  assert.equal(overflowFill?.props.style?.width, "100%");
});

test("50% 以上為預設綠色，不加額外顏色 class", () => {
  const fill50 = findElementByClassName(EnergyBar({ percent: 50 }), "energy-bar-fill");
  const fill100 = findElementByClassName(EnergyBar({ percent: 100 }), "energy-bar-fill");

  assert.equal(fill50?.props.className, "energy-bar-fill");
  assert.equal(fill100?.props.className, "energy-bar-fill");
});

test("30 到 49% 呈現橘黃色 tier-mid", () => {
  const fill49 = findElementByClassName(EnergyBar({ percent: 49 }), "energy-bar-fill");
  const fill30 = findElementByClassName(EnergyBar({ percent: 30 }), "energy-bar-fill");

  assert.match(fill49?.props.className ?? "", /energy-bar-fill-tier-mid/);
  assert.match(fill30?.props.className ?? "", /energy-bar-fill-tier-mid/);
});

test("低於 30% 呈現紅色 tier-low", () => {
  const fill29 = findElementByClassName(EnergyBar({ percent: 29 }), "energy-bar-fill");
  const fill0 = findElementByClassName(EnergyBar({ percent: 0 }), "energy-bar-fill");

  assert.match(fill29?.props.className ?? "", /energy-bar-fill-tier-low/);
  assert.match(fill0?.props.className ?? "", /energy-bar-fill-tier-low/);
});

test("不再載入任何 SVG 圖片素材", () => {
  const view = EnergyBar({ percent: 80 });
  const findImage = (node: ReactNode): boolean => {
    if (Array.isArray(node)) return node.some(findImage);
    if (!isValidElement<{ children?: ReactNode }>(node)) return false;
    if (typeof node.type === "function" && node.type.name === "Image") return true;
    if (typeof node.type === "function") {
      const Component = node.type as (props: unknown) => ReactNode;
      return findImage(Component(node.props));
    }
    return findImage(node.props.children);
  };

  assert.equal(findImage(view), false);
});
