import { v4 as uuid } from "uuid"

import * as input from './json_example.json'

abstract class CommandTemplateElement {
  type: string;
  constructor(type: string) {
    this.type = type
  }
  abstract render(argument?: string): string;
}

class CommandTemplateElementLitteral extends CommandTemplateElement {
  content: string;
  constructor(content: string) {
    super("litteral")
    this.content = content
  }
  render(): string {
    return this.content
  }
}

class CommandTemplateElementParameter extends CommandTemplateElement {
  constructor() {
    super("parameter")
  }
  render(argument: string): string {
    return argument
  }
}

class CommandTemplate {
  name: string;
  elements: CommandTemplateElement[] = [];
  constructor(name: string) {
    this.name = name
  }

  render(arguments_list: string[]): string {
    let arg_idx: number = 0
    // Implementation of render method for CommandTemplate
    let built_command = this.elements.map(element => {
      if (element.type == "litteral") { return element.render() }
      if (element.type == "parameter") {
        if (!arguments_list[arg_idx]) { throw "CommandTemplate render() NOT ENOUGH ARGUMENTS" }
        let rendered = element.render(arguments_list[arg_idx])
        arg_idx = arg_idx + 1
        return rendered
      }

    }).join("");
    if (!(arguments_list.length === arg_idx)) {
      throw "CommandTemplate render() TOO MANY ARGUMENTS"
    }
    return built_command
  }
}


let command_templates: CommandTemplate[] = [];

abstract class LayoutElement {
  type: string;
  uuid: string;
  constructor(type: string) {
    this.type = type
    this.uuid = type + '_' + uuid()
  }
  abstract render(parent_uuid: string, order: number): void
}


abstract class AnyLayoutElement extends LayoutElement { }
abstract class ContainedLayoutElement extends AnyLayoutElement { }



class TermWindow extends LayoutElement {
  maximised: string;
  fullscreen: string;
  size_x: number;
  size_y: number;
  title: string;
  main_element: AnyLayoutElement;
  constructor(maximised: string, fullscreen: string, size_x: number, size_y: number, title: string, main_element: AnyLayoutElement) {
    super("window")
    this.maximised = maximised;
    this.fullscreen = fullscreen;
    this.size_x = size_x;
    this.size_y = size_y;
    this.title = title;
    this.main_element = main_element;
  }

  render(parent_uuid: string, order: number): void {
    console.log('    [[[' + this.uuid + ']]]');
    console.log('      type = Window');
    console.log('      parent = ""');
    console.log(`      order = 0`);
    console.log(`      maximised = ${this.maximised}`);
    console.log(`      fullscreen = ${this.fullscreen}`);
    console.log(`      size = ${this.size_x}, ${this.size_y}`);
    console.log(`      title = ${this.title}`);
    this.main_element.render(this.uuid, 0)
  }
}


class NotebookElement extends AnyLayoutElement {
  tabs: NotebookTab[] = [];
  constructor() {
    super("notebook")
  }
  render(parent_uuid: string, order: number): void {
    console.log('    [[[' + this.uuid + ']]]');
    console.log('      type = Notebook');
    console.log('      parent = ' + parent_uuid);
    console.log(`      order = 0`);
    console.log('      labels = ' + this.tabs.map(tab => tab.title).join(', '));
    console.log('      active_page = 0');
    this.tabs.forEach((tab, idx) => tab.render(this.uuid, idx));
  }
}


class NotebookTab {
  title: string;
  main_element: ContainedLayoutElement;
  constructor(title: string, main_element: ContainedLayoutElement) {
    this.title = title
    this.main_element = main_element
  }

  render(parent_uuid: string, order: number): void {
    this.main_element.render(parent_uuid, order);
  }
}

class TemplatedTerminalElement extends ContainedLayoutElement {
  template_name: string;
  title: string;
  group: string;
  profile: string;
  arguments: string[] = [];
  constructor(title: string, template_name: string, group: string, profile: string) {
    super('templated_terminal');
    this.title = title
    this.template_name = template_name
    this.group = group
    this.profile = profile
  }

  render(parent_uuid: string, order: number): void {
    console.log(`    [[[${this.uuid}]]]`);
    console.log('      title = ' + this.title);
    console.log('      type = Terminal');
    console.log('      parent = ' + parent_uuid);
    console.log('      order = ' + order);
    console.log('      group = ' + this.group);
    console.log('      profile = ' + this.profile);
    console.log('      uuid = ' + uuid());
    let command_template = command_templates.find(elem => elem.name === this.template_name)
    if (!command_template) { throw "TemplatedTerminalElement render() template_name NOT FOUND" }
    let command = command_template.render(this.arguments)
    console.log('      command = ' + command);
  }
}

class HorizontalSplitElement extends ContainedLayoutElement {
  first_element: ContainedLayoutElement;
  second_element: ContainedLayoutElement;

  constructor(first_element: ContainedLayoutElement, second_element: ContainedLayoutElement) {
    super('horizontal_split');
    this.first_element = first_element
    this.second_element = second_element
  }
  render(parent_uuid: string, order: number): void {
    console.log(`    [[[${this.uuid}]]]`);
    console.log('      type = HPaned');
    console.log('      parent = ' + parent_uuid);
    console.log('      order = ' + order);
    console.log('      ratio = 0.5');
    this.first_element.render(this.uuid, 0);
    this.second_element.render(this.uuid, 1);
  }
}

class VerticalSplitElement extends ContainedLayoutElement {
  first_element: ContainedLayoutElement;
  second_element: ContainedLayoutElement;

  constructor(first_element: ContainedLayoutElement, second_element: ContainedLayoutElement) {
    super('vertical_split');
    this.first_element = first_element
    this.second_element = second_element
  }
  render(parent_uuid: string, order: number): void {
    console.log(`    [[[${this.uuid}]]]`);
    console.log('      type = VPaned');
    console.log('      parent = ' + parent_uuid);
    console.log('      order = ' + order);
    console.log('      ratio = 0.5');
    this.first_element.render(this.uuid, 0);
    this.second_element.render(this.uuid, 1);
  }
}

class GlobalConfigOption {
  key: string;
  value: string;

  constructor(key: string, value: string) {
    this.key = key
    this.value = value
  }

  render(): void {
    console.log(`  ${this.key} = ${this.value}`);
  }
}

class Keybinding {
  key: string;
  value: string;

  constructor(key: string, value: string) {
    this.key = key
    this.value = value
  }

  render(): void {
    console.log(`  ${this.key} = ${this.value}`);
  }
}

class Profile {
  name: string;
  font?: string;
  scrollback_infinite: string;
  exit_action: string;
  constructor(name: string, scrollback_infinite: string, exit_action: string, font?: string) {
    this.name = name
    this.font = font
    this.scrollback_infinite = scrollback_infinite
    this.exit_action = exit_action
  }
  render(): void {
    console.log(`  [[${this.name}]]`);
    console.log('    scrollback_infinite = ' + this.scrollback_infinite);
    console.log('    exit_action = ' + this.exit_action);
    if (this.font) {
      console.log('    use_system_font = False');
      console.log('    font = ' + this.font);
    }
  }
}


class Layout {
  name: string;
  windows: TermWindow[];
  constructor(name: string, windows: TermWindow[]) {
    this.name = name
    this.windows = windows
  }

  render(): void {
    console.log(`  [[${this.name}]]`);
    this.windows.forEach(window => window.render("", 0));
  }
}


class Config {
  global_config: GlobalConfigOption[];
  keybindings: Keybinding[];
  profiles: Profile[];
  layouts: Layout[];
  constructor(global_config: GlobalConfigOption[], keybindings: Keybinding[], profiles: Profile[], layouts: Layout[]) {
    this.global_config = global_config
    this.keybindings = keybindings
    this.profiles = profiles
    this.layouts = layouts
  }

  render(): void {
    console.log(`[global_config]`);
    this.global_config.forEach(option => option.render());
    console.log(`[keybindings]`);
    this.keybindings.forEach(keybinding => keybinding.render());
    console.log(`[profiles]`);
    this.profiles.forEach(profile => profile.render());
    console.log(`[layouts]`);
    this.layouts.forEach(layout => layout.render());
    console.log(`[plugins]`);
  }
}






function parseCommandTemplateElement(jsonElement: any): CommandTemplateElement {
  if (jsonElement.type === "litteral") {
    return new CommandTemplateElementLitteral(jsonElement.content);
  } else if (jsonElement.type === "parameter") {
    return new CommandTemplateElementParameter();
  } else {
    throw new Error("Invalid CommandTemplateElement type: " + jsonElement.type);
  }
}

function parseCommandTemplate(jsonTemplate: any): CommandTemplate {
  const commandTemplate = new CommandTemplate(jsonTemplate.name);
  for (const jsonElement of jsonTemplate.elements) {
    const element = parseCommandTemplateElement(jsonElement);
    commandTemplate.elements.push(element);
  }
  return commandTemplate;
}

function parseLayoutElement(jsonElement: any): LayoutElement {
  if (jsonElement.type === "window") {
    const mainElement = parseLayoutElement(jsonElement.main_element);
    return new TermWindow(
      jsonElement.maximised,
      jsonElement.fullscreen,
      jsonElement.size_x,
      jsonElement.size_y,
      jsonElement.title,
      mainElement
    );
  } else if (jsonElement.type === "notebook") {
    const notebook = new NotebookElement();
    for (const jsonTab of jsonElement.tabs) {
      const mainElement = parseLayoutElement(jsonTab.main_element);
      const tab = new NotebookTab(jsonTab.title, mainElement);
      notebook.tabs.push(tab);
    }
    return notebook;
  } else if (jsonElement.type === "templated_terminal") {
    const templatedTerminalElement = new TemplatedTerminalElement(
      jsonElement.title,
      jsonElement.template_name,
      jsonElement.group,
      jsonElement.profile
    );
    for (const argument of jsonElement.arguments) {
      templatedTerminalElement.arguments.push(argument)
    }
    return templatedTerminalElement
  } else if (jsonElement.type === "horizontal_split") {
    const firstElement = parseLayoutElement(jsonElement.first_element);
    const secondElement = parseLayoutElement(jsonElement.second_element);
    return new HorizontalSplitElement(firstElement, secondElement);
  } else if (jsonElement.type === "vertical_split") {
    const firstElement = parseLayoutElement(jsonElement.first_element);
    const secondElement = parseLayoutElement(jsonElement.second_element);
    return new VerticalSplitElement(firstElement, secondElement);
  } else {
    throw new Error("Invalid LayoutElement type: " + JSON.stringify(jsonElement));
  }
}

function parseConfig(jsonConfig: any): Config {
  const globalConfig: GlobalConfigOption[] = [];
  const keybindings: Keybinding[] = [];
  const profiles: Profile[] = [];
  const layouts: Layout[] = [];

  for (const jsonCommandTemplate of jsonConfig.command_templates) {
    const command_template = parseCommandTemplate(jsonCommandTemplate)
    command_templates.push(command_template);
  }

  for (const jsonOption of jsonConfig.global_config) {
    const option = new GlobalConfigOption(jsonOption.key, jsonOption.value);
    globalConfig.push(option);
  }

  for (const jsonKeybinding of jsonConfig.keybindings) {
    const keybinding = new Keybinding(jsonKeybinding.key, jsonKeybinding.value);
    keybindings.push(keybinding);
  }

  for (const jsonProfile of jsonConfig.profiles) {
    const profile = new Profile(
      jsonProfile.name,
      jsonProfile.scrollback_infinite,
      jsonProfile.exit_action,
      jsonProfile.font
    );
    profiles.push(profile);
  }

  for (const jsonLayout of jsonConfig.layouts) {
    const windows: TermWindow[] = [];
    for (const jsonWindow of jsonLayout.windows) {
      const mainElement = parseLayoutElement(jsonWindow.main_element);
      const window = new TermWindow(
        jsonWindow.maximised,
        jsonWindow.fullscreen,
        jsonWindow.size_x,
        jsonWindow.size_y,
        jsonWindow.title,
        mainElement
      );
      windows.push(window);
    }
    const layout = new Layout(
      jsonLayout.name,
      windows
    )
    layouts.push(layout)
  }
  return new Config(globalConfig, keybindings, profiles, layouts)
}
// console.log(JSON.stringify(parseConfig(input)))

parseConfig(input).render()

// const testtemplate =     {
//   "name": "echo",
//   "elements": [
//     {
//       "type": "litteral",
//       "content": "echo "
//     },
//     {
//       "type": "parameter"
//     }
//   ]
// }

// const testjson = {
//   "type": "templated_terminal",
//   "template_name": "echo",
//   "title": "Terminal 2 1",
//   "group": "Group 2",
//   "profile": "default",
//   "arguments": [
//     "terminal2_1"
//   ]
// }