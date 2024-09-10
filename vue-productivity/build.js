import * as fs from "fs";
import * as path from "path";
import { Project, SyntaxKind } from "ts-morph";

const pathToTypes = path.join(
  "..",
  "node_modules",
  "dom-expressions",
  "src",
  "jsx.d.ts"
);
const project = new Project();
const sourceFile = project.addSourceFileAtPath(pathToTypes);

// Add VNode import
sourceFile.addImportDeclaration({
  namedImports: ["VNodeRef", "VNode"],
  moduleSpecifier: "vue",
});

const interfaces = sourceFile.getDescendantsOfKind(
  SyntaxKind.InterfaceDeclaration
);
const types = sourceFile.getDescendantsOfKind(SyntaxKind.TypeAliasDeclaration);

/*
  Element
*/
const Element = types.find((type) => type.getName() === "Element");

Element.replaceWithText("interface Element extends VNode {}");

/*
  ElementClass
*/
const ElementClass = interfaces.find(
  (inter) => inter.getName() === "ElementClass"
);

ElementClass.addMember("$props: {}");

/*
  ElementAttributesProperty
*/
const ElementAttributesProperty = interfaces.find(
  (inter) => inter.getName() === "ElementAttributesProperty"
);

ElementAttributesProperty.addMember("$props: {}");

/*
  ElementChildrenAttribute
*/
const ElementChildrenAttribute = interfaces.find(
  (inter) => inter.getName() === "ElementChildrenAttribute"
);

// Remove "children"
ElementChildrenAttribute.getMembers().forEach((member) => member.remove());
// Add "children"
ElementChildrenAttribute.addMember("children: {}");

/* 
  IntrinsicAttributes
*/
const IntrinsicAttributes = interfaces.find(
  (inter) => inter.getName() === "IntrinsicAttributes"
);

// Remove "ref"
IntrinsicAttributes.getMembers().forEach((member) => member.remove());
// Add "key" and "ref"
IntrinsicAttributes.addMember("key?: PropertyKey");
IntrinsicAttributes.addMember("ref?: VNodeRef");

// CustomAttributes
const CustomAttributes = interfaces.find(
  (inter) => inter.getName() === "CustomAttributes"
);

// Remove "ref", "classList" and "$ServerOnly"
CustomAttributes.getMembers().forEach((member) => member.remove());
// Add "key" and "ref"
CustomAttributes.addMember("key?: PropertyKey");
CustomAttributes.addMember("ref?: VNodeRef");

/*
  DOMAttributes
*/
const DOMAttributes = interfaces.find(
  (inter) => inter.getName() === "DOMAttributes"
);
const childrenMember = DOMAttributes.getMembers().find(
  (member) => member.getName() === "children"
);

childrenMember.remove();

DOMAttributes.addMember("children?: {}");

/*
  CustomEventHandlersCamelCase
*/
const CustomEventHandlersCamelCase = interfaces.find(
  (inter) => inter.getName() === "CustomEventHandlersCamelCase"
);

CustomEventHandlersCamelCase.getMembers().forEach((member) => {
  const name = member.getName();
  // Adjust to only uppercase the
  member.rename(name.substring(0, 3) + name.substring(3).toLowerCase());
});

fs.writeFileSync("./jsx-runtime/index.d.ts", sourceFile.print());

// Fixes children typing of components used with "defineComponent"
fs.appendFileSync(
  "./dist/index.d.ts",
  `declare module "vue" {
  export interface ComponentCustomProps {
    children?: {};
  }
}
`
);
