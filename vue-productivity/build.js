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
  namedImports: "VNodeRef",
  moduleSpecifier: "vue",
});

const interfaces = sourceFile.getDescendantsOfKind(
  SyntaxKind.InterfaceDeclaration
);

/*
  ElementChildrenAttribute
*/
const ElementChildrenAttribute = interfaces.find(
  (inter) => inter.getName() === "ElementChildrenAttribute"
);

// Remove "children"
ElementChildrenAttribute.getMembers().forEach((member) => member.remove());
// Add "slots"
ElementChildrenAttribute.addMember("slots: {}");

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

DOMAttributes.addMember("slots?: Element | undefined");

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
