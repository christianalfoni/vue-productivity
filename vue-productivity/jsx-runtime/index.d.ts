import { NativeElements, ReservedProps, VNode } from "vue";

export {
  h as jsx,
  h as jsxDEV,
  Fragment,
  ReservedProps,
  NativeElements,
} from "@vue/runtime-dom";

type ReservedPropsWithSlots = ReservedProps & {
  slots?: any;
};

type NativeElementsWithSlots = {
  [K in keyof NativeElements]: NativeElements[K] & { slots: any };
};

export namespace JSX {
  export interface Element extends VNode {}
  export interface ElementAttributesProperty {}

  export interface IntrinsicElements extends NativeElementsWithSlots {
    // allow arbitrary elements
    // @ts-ignore suppress ts:2374 = Duplicate string index signature.
    [name: string]: any;
  }

  export interface IntrinsicAttributes extends ReservedPropsWithSlots {}

  export interface ElementChildrenAttribute {
    slots?: {};
  }
}
