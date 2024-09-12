/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
import type { VNode } from "vue";
import type { ReservedProps, NativeElements } from "vue-productivity";

/**
 * JSX namespace for usage with @jsxImportsSource directive
 * when ts compilerOptions.jsx is 'react-jsx' or 'react-jsxdev'
 * https://www.typescriptlang.org/tsconfig#jsxImportSource
 */
export { h as jsx, h as jsxDEV, Fragment } from "vue";

export namespace JSX {
  export interface Element extends VNode {}
  export interface ElementClass {
    $props: {};
  }
  export interface ElementAttributesProperty {
    $props: {};
  }
  export interface ElementChildrenAttribute {
    children: {};
  }
  export interface IntrinsicElements extends NativeElements {
    // allow arbitrary elements
    // @ts-ignore suppress ts:2374 = Duplicate string index signature.
    [name: string]: any;
  }
  export interface IntrinsicAttributes extends ReservedProps {}
}
