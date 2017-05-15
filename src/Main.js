(function (window) {

    function define() {

        var Metatron = {};

        Metatron.EventAPI;
        Metatron.DrawingBoard;
        Metatron.EntityStore;
        Metatron.CommandExecuter;
        Metatron.Commands;
        Metatron.Util;

        Metatron.create = function (containerId, stencilBoxConfig, editMode) {

            var _instance = {

                containerId: containerId,
                stencilBoxConfig: stencilBoxConfig,
                editMode: editMode,

                eventAPI: new Metatron.EventAPI(),
                drawingBoard: {},
                entityStore: {},
                commandExecuter: {},

                usableMargin: 500,
                gridSpacing: 15,
                showGrid: false,
                instancePaper: {},
                instanceStencilUsage: {},
                menubarGraphicSet: null,
                instanceMenubarElement: {},
                observerModeMenuItems: [],
                editModeMenuItems: []
            };

            function init() {
                _instance.drawingBoard = new Metatron.DrawingBoard(_instance, containerId, stencilBoxConfig);
                _instance.entityStore = new Metatron.EntityStore(_instance, stencilBoxConfig);
                _instance.commandExecuter = new Metatron.CommandExecuter(_instance);
                _instance.commands = new Metatron.Commands(_instance);
                _instance.util = new Metatron.Util(_instance);
            };

            var instance = {
                reload: function () {
                    init();
                },
                extract: function () {
                    return JSON.stringify(_instance.entityStore.extract());
                },
                load: function (jsonData) {
                    init();
                    try {
                        _instance.entityStore.load(JSON.parse(jsonData));
                    } catch (err) {
                        console.log(err);
                        this.reload();
                    }
                },
                enableEditMode: function () {
                    var jsonData = this.extract();
                    _instance.editMode = true;
                    this.load(jsonData);
                },
                disableEditMode: function () {
                    var jsonData = this.extract();
                    _instance.editMode = false;
                    this.load(jsonData);
                },
                on: function (event, onEventFunction) {
                    _instance.eventAPI.on(event, onEventFunction);
                },
                addIndicator: function (componentId, indicatorName) {
                    _instance.drawingBoard.addIndicator(_instance.entityStore.getComponent(componentId), indicatorName);
                },
                removeIndicator: function (componentId, indicatorName) {
                    _instance.drawingBoard.removeIndicator(_instance.entityStore.getComponent(componentId), indicatorName);
                },
                removeIndicators: function (componentId) {
                    if (componentId) {
                        var component = _instance.entityStore.getComponent(componentId);
                        _instance.drawingBoard.removeIndicators(component);
                    } else {
                        _instance.drawingBoard.clearAllIndicators();
                    }
                },
                renameComponent: function (componentId, name) {
                    var component = _instance.entityStore.getComponent(componentId);
                    if (component) {
                        _instance.commandExecuter.execute(new _instance.commands.RenameComponentCommand({
                            component: component,
                            newName: name,
                            oldName: component.displayName
                        }), true);
                    }
                },
                toggleIndicator: function (componentId, indicatorName) {
                    _instance.drawingBoard.toggleIndicator(_instance.entityStore.getComponent(componentId), indicatorName);
                },
                deleteSelection: function() {
                    _instance.drawingBoard.deleteSelection();
                },
                blockUI: function () {
                    _instance.drawingBoard.blockUI();
                },
                unblockUI: function () {
                    _instance.drawingBoard.unblockUI();
                },
                getMenu: function (editorMode) {
                    return _instance.drawingBoard.getMenu(editorMode);
                },
                setMenu: function (editorMode, menuConfig) {
                    _instance.drawingBoard.setMenu(editorMode, menuConfig);
                },
                addMenuItem: function (editorMode, menuItemConfig) {
                    _instance.drawingBoard.addMenuItem(editorMode, menuItemConfig);
                },
                addComponent: function (component) {
                    _instance.entityStore.addComponent(component, false);
                },
                undo: function () {
                    _instance.commandExecuter.undo();
                },
                redo: function () {
                    _instance.commandExecuter.redo();
                },
                showGrid: function (lineWidth) {
                    var jsonData = this.extract();
                    _instance.showGrid = true;
                    this.load(jsonData);
                },
                hideGrid: function () {
                    var jsonData = this.extract();
                    _instance.showGrid = false;
                    this.load(jsonData);
                }
            };

            init();

            return instance;
        };

        return Metatron;
    }

    if (typeof (Metatron) === 'undefined') {
        window.Metatron = define();
    } else {
        console.error("Metatron has already been defined");
    }

})(window);
