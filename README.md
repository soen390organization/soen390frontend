# Concordia Compass - SOEN 390 Project

## Getting Started

### Project Details

Node Version: 20.11.1\
Angular Version: 19.0\
Ionic Version: 7.2.0

### Node Installation/Management

**For Mac:**\
Using homebrew, you can install nvm (Node Version Manager) with the command `brew install nvm`

**For Windows:**\
You can download and install nvm with the installer from https://github.com/coreybutler/nvm-windows/releases/tag/1.2.2

**Getting on Version 20.11.1**\
Once nvm is installed, run the following commands:\
`nvm install 20.11.1`\
`nvm use 20.11.1`

Now you're on the proper node version to run the project :)

### Ionic

**Installation**\
Ionic provides a CLI that allows us to generate components & modules and serve our project so that it can be viewed in our browser.
Run the following command to install the CLI\
`npm install -g @ionic/cli`

Now you should have access to Ionic's entire CLI, for more information visit: https://ionicframework.com/docs/cli

**Components**\
Ionic offers a variety of components for you to use, check them out at: https://ionicframework.com/docs/components

All of these components are accessible when using `import { IonicModule } from '@ionic/angular';` inside your Component/Module.

### Project Setup

1. Pull the project repository from GitHub using the following command: `git clone <repo-url>`
2. Navigate to the project folder within your terminal and run `npm install` _(Make sure you are on node v20.11.1)_
3. Run `ionic serve` to see the app on your browser at http://localhost:8100

## Angular Basics

### Generating a Component

You can generate a Component with `ionic g c components/<component_name>`

This will provide you with 4 files:

- <component_name>.component.html
  - Contains the template for the component, where you define the HTML structure and Angular bindings.
- <component_name>.component.scss
  - Contains the styles for the component, which can be scoped to this particular component.
- <component_name>.component.ts
  - The TypeScript file that defines the logic and behavior of the component.
- <component_name>.component.spec.ts
  - A test file used for unit testing the component's functionality.

### Generating a Module (OPTIONAL)

You can generate a Module with `ionic g m components/<component_name> -m app`

The `-m app` flag allows the newly created module to automatically be imported and added to our app.module.ts

Modules are a mechanism to group components, directives, pipes and services that are related to a feature area of the angular application.\
In short, dependencies for your component go in here.

Standalone is defaulted in Angular 19, which means components no longer require modules.\
To enable the use of a module in your component, you need to import the module and include `standalone: false` inside of `@Component({...})` in your Component.\

**_When to create a Module?_**\
Modules in Angular should be created mainly for when sub-features share dependencies, this avoids code redundancy and keeps our code organized.

## NgRx Basics

- We’ll be using @ngrx/store for RxJS global state management.
- NgRx store provides state management through the use of single state and actions in order to express state changes.

### Some key Concepts to Understand:

- Actions: Describe unique events that are dispatched from components and services.
- Reducers: Pure Functions that handle state changes by taking the current state and the latest action, and combining them to compute a new state.
- Selectors: Pure functions used to select, derive, and compose pieces of state.
- Effects: Isolate side effects from components, allowing for more pure components that select state and dispatch actions.
- Store: where all of the state for the application lives; an observable of state and an observer of actions.

### NgRx LifeCycle

This diagram is a useful tool to help understand the NgRx Lifecycle.
<img width="812" alt="Screenshot 2025-01-21 at 3 13 43 PM" src="https://github.com/user-attachments/assets/6ab4af56-7892-4b08-ac5d-8f84b8a5b4aa" />

#### State Management Lifecycle: (i.e. a button is clicked)

1. A component dispatches an action to indicate that something has happened.
2. The associated reducer immediately detects the action in the app and determine how the state should be modified as a result.
3. The reducer takes the current state and store the new state in the store.
4. If the store wants to use the new state it’s acquired, a selector is used to pull the specific state needed.

This is the standard lifecycle without considering asynchronous calls (i.e. API calls). This is where effects come into play.

#### State Management LifeCycle w/ Effects: ( i.e. fetching users)

1. A component dispatches an action to indicate that some data is requested.
2. This action will immediately be handled by the reducer, but it will quickly realize that it doesn’t have the necessary data yet since we need to call the service to acquire it.
3. The effect will also detect the action and go fetch the users data from the service.
4. Once that data is finished loading, the effect will dispatch a new action depending on whether the data is received successfully or not.
5. If successful, the reducer can now handle the action and add the new state to the store.

### File Structure:

Inside the Store folder, there will be specific folders for managing different types of state. For each specific state, the following files are created:

- <state-type_name>.index.ts
  - Acts as a central export point for state-related state files
- <state-type_name>.actions.ts
  - Defines actions for state changed
- <state-type_name>.reducers.ts
  - Defines how the state changed based on actions using reducers
- <state-type_name>.reducers.spec.ts
  - Unit tests for reducer
- <cstate-type_name>.selectors.ts
  - Defined reusable selectors to retrieve specific slices of the state
