**请在此补充你的项目规范（Add your own guidelines here）**
<!--

System Guidelines

Use this file to provide the AI with rules and guidelines you want it to follow.
This template outlines a few examples of things you can add. You can add your own sections and format it to suit your needs

TIP: More context isn't always better. It can confuse the LLM. Try and add the most important rules you need

# General guidelines

Any general rules you want the AI to follow.
For example:

* Only use absolute positioning when necessary. Opt for responsive and well structured layouts that use flexbox and grid by default
* Refactor code as you go to keep code clean
* Keep file sizes small and put helper functions and components in their own files.

--------------

# Design system guidelines
Rules for how the AI should make generations look like your company's design system

Additionally, if you select a design system to use in the prompt box, you can reference
your design system's components, tokens, variables and components.
For example:

* Use a base font-size of 14px
* Date formats should always be in the format “Jun 10”
* The bottom toolbar should only ever have a maximum of 4 items
* Never use the floating action button with the bottom toolbar
* Chips should always come in sets of 3 or more
* Don't use a dropdown if there are 2 or fewer options

You can also create sub sections and add more specific details
For example:


## Button
The Button component is a fundamental interactive element in our design system, designed to trigger actions or navigate
users through the application. It provides visual feedback and clear affordances to enhance user experience.

### Usage
Buttons should be used for important actions that users need to take, such as form submissions, confirming choices,
or initiating processes. They communicate interactivity and should have clear, action-oriented labels.

### Variants
* Primary Button
  * Purpose : Used for the main action in a section or page
  * Visual Style : Bold, filled with the primary brand color
  * Usage : One primary button per section to guide users toward the most important action
* Secondary Button
  * Purpose : Used for alternative or supporting actions
  * Visual Style : Outlined with the primary color, transparent background
  * Usage : Can appear alongside a primary button for less important actions
* Tertiary Button
  * Purpose : Used for the least important actions
  * Visual Style : Text-only with no border, using primary color
  * Usage : For actions that should be available but not emphasized
-->
 
## 提交规范与自动化检查

本项目已启用 Conventional Commits 规范与 Git 钩子自动化检查：

- 提交信息规范：使用类型前缀（如 `feat|fix|docs|style|refactor|test|build|chore|ci`），示例：
  - `feat(data-preprocessing): add dataset selection step`
  - `fix(dialog): prevent horizontal scroll in preprocessing modal`
  - `docs(changelog): record workflow update`
- 头部长度限制：提交信息第一行不超过 100 个字符（Commitlint 规则）。
- pre-commit 校验：当提交包含以下文件改动时，要求同步更新 CHANGELOG.md 且包含当天日期段（`### YYYY-MM-DD`）：
  - `src/**`、`styles/**`、`vite.config.ts`、`package.json`
- commit-msg 校验：使用 Commitlint 检查提交信息是否符合规范。

相关文件与脚本：
- `package.json`：`prepare` 和 `check:changelog` 脚本
- `commitlint.config.cjs`：提交信息规则配置
- `scripts/check-changelog.js`：变更日志校验脚本
- `.husky/pre-commit`、`.husky/commit-msg`：Git 钩子

注意：如遇到网络问题导致 `git push` 失败，可稍后重试或切换网络环境。
