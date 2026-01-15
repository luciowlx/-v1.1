---
name: component_generator
description: Generate a new React component with Ant Design, following the project's best practices.
---

# Component Generator Skill

This skill helps you generate consistent, high-quality React components using Ant Design and TypeScript.

## Usage

When the user asks to "create a component" or "add a new UI feature", use this skill to ensure consistency.

## Steps

1. **Analyze Requirements**: Understand the component's purpose, props, and state requirements.
2. **Read Template**: Read the template file at `.agent/skills/component_generator/templates/Component.tsx`.
3. **Generate Code**: Create the new component file based on the template.
    * Use functional components with hooks.
    * Include TypeScript interfaces for Props.
    * Use Ant Design components (Button, Modal, Table, etc.).
    * Ensure proper localization (Chinese comments and UI text as per global rules).
4. **Verify**: Ensure the component has no lint errors and follows the project structure.

## Context

* **Style**: Use Tailwind CSS or `antd-style` if applicable, but prefer standard Ant Design pattern.
* **Icons**: Use `@ant-design/icons` or `lucide-react`.
