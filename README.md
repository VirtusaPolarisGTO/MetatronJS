# MetatronJS

MetatronJS is a Javascript UI library that helps you create your own custom workflow designers.

**[Demo](https://virtusapolarisgto.github.io/MetatronJS/demo)**

#### Features:
  * Create your own stencil-box by configuring your custom components and their beahvior
  * Use the components in your stencil-box to draw new workflows
  * Interact with components based on your predefined custom actions
  * Extract your workflow in JSON format
  * Load created workflows by providing it in JSON format
  * Use the workflow view in either Edit or Observer mode.
  * In Observer mode, you can place indicators on components.
  * Indicators can be used to show additional information
  * Indicators can also be used to visualize live workflows in action as the component states change.

#### Setting up:
You need to have `npm` installed to build the library.  
Once your environment is set up, you need to build the project
```batch
npm install
npx grunt
```
Now the project has been built and the `./distrib/` folder has been created with the distributable files inside it
```
metatron.js
metatron.min.js
```
Finally import the library file into your project
```html
<script src="metatron.min.js" type="text/javascript"></script>
```

#### Dependencies
* [`JQuery`](https://jquery.com/)
* [`RaphaelJS`](https://github.com/DmitryBaranovskiy/raphael)
  
# Getting started
If any of the following Configurations, API or Events are unclear,you can check out the **demo** project located at `./demo/` which will be functional after you have completed the **Setting Up** step.  
This demo showcases all the things you need to know to start using MetatronJS. Feel free to play around with it and learn how it can be integrated with your project.
#### Creating your workspace
```javascript
var metWorkspace = Metatron.create(<CONTAINER_DIV_ID>, <STENCIL_BOX_CONFIG>, <EDIT_MODE>);
```
`<CONTAINER_DIV_ID>`: String to identify the div which you want the workflow designer to reside in.  
`<STENCIL_BOX_CONFIG>`: This is your configuration JSON which will define all the tools you need and their individual behavior. (See below for an example)  
`<EDIT_MODE>`: This a boolean flag to determine whether you want to load the designer in `edit` or `observer` mode. (`true` to start in edit mode)  

#### Configuration JSON
Here is an example of a configuration JSON for your stencil-box.  
This example defines one stencil which will then be available for you to use in your workflow editor.  
You can add more of these to the `stencils` array in the configuration JSON.

```javascript
var STENCIL_BOX_CONFIG = {
    stencils: [
        {
            id: 'custom_task',
            name: 'Custom Task',
            imgPath: 'images/custom-task.svg',
            actions: [],
            inboundConnectorConfigs: {
                maxCount: 1
            },
            outboundConnectorConfigs: [
                {
                    type: 'success',
                    maxCount: 1,
                },
                {
                    type: 'fail',
                    maxCount: 1,
                    color: '#EA8988',
                    defaultLabel: 'Fail'
                }
            ],
            indicators: []
        }
    ]
};
```
##### Stencil Options
* `id`: an identifier for the stencil
* `name`: a display name for the component type represented by this stencil. This will be visible in your stencil-box
* `imgPath`: an image to represent your stencil
* `[actions]`: an array of actions which can be accessed by right clicking a component created from this stencil
    * `displayName`: name to display on right-click menu
    * `executerFunction`: function to execute when clicked. The relevant `component` is passed into this function
* `inboundConnectorConfigs`: defines the constrains on in-coming connections
    * `maxCount`: maximum number of in-cmoning connections that will be allowed
* `outboundConnectorConfigs`: difines an array of out-going connection types and constraints. Each connector config should look like this:
    * `type`: an identifier for the type of connection
    * `maxCount`: maximum number of allowed connections of this type
    * `[color]`: color for connecting line. Default color will be set if not provided
    * `[defaultLabel]`: label to be dsiplayed on connecting line. No label will be displayed by default
* `[indicators]`: an array of indicators which are relevant to this component. They can be switched on or off when in `observer` mode. Each indicator config should look like this:
    * `name`: you will use this to toggle indicators later
    * `displayName`: this will be shown when hovering over the indicator
    * `iconPath`: image for the indicator
* `[componentLimit]`: a number specifying how many of components can be made from this stencil
* `[nonRemovable]`: a boolean flag specifying whether components made from this stencil can be removed by the user
* `[hidden]`: a boolean flag specifying whether this stencil is visible in the stencil-box in the edit view. (Components such as **Start** and **End** will probably be inserted to the workspace programatically and shouldn't be available in the stencil-box when creating workflows)

#### API
* `extract(): jsonModel`  
   Exctracts a JSON model of the currently created workflow.

* `load( jsonModel )`  
   Loads a JSON model which has been previously extracted or created manually.

* `reload()`  
   Reloads the workspace.

* `enableEditMode()`  
   Switches the workspace to `edit` mode.

* `disableEditMode()`  
   Switches the workspace to `observer` mode.

* `addIndicator( componentId, indicatorName )`  
   Displays an indicator image next to the specified component. This indicator has to be predefined in the stencil config.

* `removeIndicator( componentId, indicatorName )`  
   Hides the specified indicator image from the specified component .

* `toggleIndicator( componentId, indicatorName )`  
   Toggles visibility of the specified indicator on the specified component.

* `removeIndicators( [componentId] )`  
   Hides all indicators from the specified component. If no component is specified, all indicators on the workspace will be hidden.

* `renameComponent( componentId, newName )`  
   Rename the specified component with the given name.

* `deleteSelection()`  
   Deletes the currently selected component from the workspace.

* `undo()`  
   Undo the last action performed.

* `redo()`  
   Redo the last action which was undone.

* `addComponent( component )`  
   Adds a component to the workspace. This is to be used when a component needs to be programatically inserted into the workspace from the stencil box (such as when setting up **Start** and **End** components). A component can be provided in the following format:
   ```javascript
    {
        displayName: 'Start',
        position: {
            x: 300,
            y: 60
        },
        stencilId: 'StartTask',
        inboundConnections: [],
        outboundConnections: []
    }
   ```

* `addMenuItem( editMode, menuItemConfig )`  
   Menu items can be added to either ***edit*** or ***observer*** modes of MetatronJS.  
   If the `editMode` flag is set to `true` then the provided `menuItemConfig` will be available in the menu bar of the ***edit*** mode, if it is set to `false` the provided `menuItemConfig` will be available in the ***observer*** mode.  
   *It is recomended that you take the menus provided in the demo for standard uses of MetatronJS.*  
   Your `menuItemConfig` can be provided in the following format:
   ```javascript
   {
        title: 'Undo',
        icon: 'images/undo.svg',
        function: function () {
            metWorkspace.undo();
        }
    }
   ```
* `getMenu( editMode ): menuItemConfig[]`  
   Returns an array of `menuItemConfig`s from the specified mode.

* `setMenu( editMode, menuItemConfig[] )`  
   Sets an array of `menuItemConfig`s to the specified mode.
   
* `showGrid()`  
   Displays the grid.
   
* `hideGrid()`  
   Hides the grid.


#### Listening to events
Here is an example of how to listen to events fired inside MetatronJS
```javascript
metWorkspace.on('componentClick', function (component) {
    console.log(component);
});
```
##### Events
* `'save'`: fires when save method is called
    * Recieves the JSON representation of your workflow
* `'componentClick'`: fires when any component is clicked
    * Recieves the clicked component object
* `'connectionClick'`: fires when any connection is clicked
    * Recieves the clicked connection object
* `'componentDblClick'`: fires when any component is double-clicked
    * Recieves the double-clicked component object
* `'executeCommand'`: fires when any command is executed. Can be used to auto-save the state of the workflow. Recieves two parameters:
    * `command`: command which was executed
    * `internal`: boolean flag to indicate whether the command was a direct user action or whether it was an internally triggered command. Only non-internal commands need to be saved in an auto-save scenario
* `'undoCommand'`: fires when undo is called
    * Recieves the command which is being undone
* `'redoCommand'`: fires when redo is called
    * Recieves the command which is being re-executed
* `'canvasClick'`: fires when canvas is clicked
    * Recieves the click event
* `'validationFailed'`: fires when MetatronJS is unable to load a currputed JSON model
    * Recieves information regarding the curruptions in the JSON model. These can then be fixed and re-loaded manually or loading can be aborted depending on your scenario
