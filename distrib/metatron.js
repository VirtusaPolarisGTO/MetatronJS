/*
 *  MetatronJS
 *  Javascript UI library that helps you create your own custom workflow designers
 *  Version: 1.0.0
 *  Author: SMAKALANDE (GTO - VirtusaPolaris)
 *
 *    Copyright 2017 VirtusaPolaris.
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

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

(function (Metatron) {
    Metatron.EventAPI = function () {
        this.EVT_SAVE = 'save';
        this.EVT_CMP_CLICK = 'componentClick';
        this.EVT_CON_CLICK = 'connectionClick';
        this.EVT_CMP_DBL_CLICK = 'componentDblClick';
        this.EVT_EXEC_COMMAND = 'executeCommand';
        this.EVT_UNDO_COMMAND = 'undoCommand';
        this.EVT_REDO_COMMAND = 'redoCommand';
        this.EVT_CANVAS_CLICK = 'canvasClick';
        this.EVT_VALIDATION_FAILED = 'validationFailed';
        this.eventFunctions = {};
        this.on = function (event, onEventFunction) {
            this.eventFunctions[event] = onEventFunction;
        }
        this.getFunction = function (event) {
            if (this.eventFunctions[event]) {
                return this.eventFunctions[event];
            } else {
                return function () {};
            }
        }
    };
})(Metatron);

(function (Metatron) {
    Metatron.EntityStore = function (_instance, stencilBoxConfig) {

        this.componentIdPrefix = 'cmp_';
        this.connectionIdPrefix = 'con_';
        this.entityCount = 0;

        this.stencilBoxConfig = stencilBoxConfig;
        this.components = {};
        this.connections = {};
        this.getStencilConfig = function (stencilId) {
            for (var i = 0; i < this.stencilBoxConfig.stencils.length; i++) {
                if (this.stencilBoxConfig.stencils[i].id === stencilId) {
                    return this.stencilBoxConfig.stencils[i];
                }
            }
        };
        this.getNextComponentId = function () {
            var possibleId = this.componentIdPrefix + (this.entityCount++);
            if (!this.getComponent(possibleId)) {
                return possibleId;
            } else {
                return this.getNextComponentId();
            }
        };
        this.addComponent = function (component, remember) {
            var stencilConfig = _instance.entityStore.getStencilConfig(component.stencilId);
            if (stencilConfig.componentLimit && _instance.instanceStencilUsage[stencilConfig.id] === stencilConfig.componentLimit) {
                console.log('Could Not Add Component: Limit Reached [' + stencilConfig.name + ']');
            } else {
                if (!component.id) {
                    component.id = this.getNextComponentId();
                }
                component.type = 'component';
                return _instance.commandExecuter.execute(new _instance.commands.AddComponentCommand({
                    component: component
                }), remember !== undefined ? remember : true);
            }
        };
        this.getComponent = function (componentId) {
            return this.components[componentId];
        };
        this.removeComponent = function (component) {
            var stencilConfig = _instance.entityStore.getStencilConfig(component.stencilId);
            if (stencilConfig.nonRemovable) {
                console.log('Could Not Remove Component: Non-Removable [' + stencilConfig.name + ']');
            } else {
                _instance.commandExecuter.execute(new _instance.commands.RemoveComponentCommand({
                    component: component
                }), true);
            }
        };
        this.addConnection = function (connection) {
            connection.id = this.connectionIdPrefix + connection.fromComponentId + connection.fromPlacement + '_' + connection.toComponentId + connection.toPlacement;
            connection.type = 'connection';
            _instance.commandExecuter.execute(new _instance.commands.AddConnectionCommand({
                connection: connection,
                animate: true
            }), true);
        };
        this.changeConnectionType = function (connection, type) {
            _instance.commandExecuter.execute(new _instance.commands.ChangeConnectionCommand({
                connection: connection,
                newConnectionType: type,
                oldConnectionType: connection.connectionType
            }), true);
        }
        this.getConnection = function (connectionId) {
            return this.connections[connectionId];
        };
        this.removeConnection = function (connection) {
            _instance.commandExecuter.execute(new _instance.commands.RemoveConnectionCommand({
                connection: connection,
                animate: true
            }), true);
        };
        this.extract = function () {
            var exportComponents = $.extend(true, {}, this.components);
            var jsonData = [];
            for (var componentId in exportComponents) {
                if (exportComponents.hasOwnProperty(componentId)) {
                    var component = exportComponents[componentId];
                    delete component.element;
                    delete component.labelElement;
                    for (var j = 0; j < component.inboundConnections.length; j++) {
                        delete component.inboundConnections[j].element;
                        if (component.inboundConnections[j].labelElement) {
                            delete component.inboundConnections[j].labelElement;
                            delete component.inboundConnections[j].labelBackgroundElement;
                        }

                    }
                    for (var j = 0; j < component.outboundConnections.length; j++) {
                        delete component.outboundConnections[j].element;
                        if (component.outboundConnections[j].labelElement) {
                            delete component.outboundConnections[j].labelElement;
                            delete component.outboundConnections[j].labelBackgroundElement;
                        }
                    }
                    jsonData.push(exportComponents[componentId]);
                }
            }
            return jsonData;
        };
        this.load = function (jsonData) {
            this.components = {};
            this.connections = {};
            for (var i = 0; i < jsonData.length; i++) {
                _instance.commandExecuter.execute(new _instance.commands.AddComponentCommand({
                    component: jsonData[i]
                }), false);
                this.entityCount++
            }
            this.validate();
        };
        this.validate = function () {
            var errorFound = false;
            var errorMsg = 'Metatron Validation Failed! \n';
            var errorData = {
                missingComponents: [],
                componentsWithInvalidInConnections: [],
                componentsWithInvalidOutConnections: []
            };
            for (var connectionId in this.connections) {
                if (this.connections.hasOwnProperty(connectionId)) {
                    var fromComponentId = this.connections[connectionId].fromComponentId;
                    var toComponentId = this.connections[connectionId].toComponentId;
                    if(!this.getComponent(fromComponentId)) {
                        errorMsg += fromComponentId + ' is missing, but there is a connection from it to ' + toComponentId + '\n';
                        if(errorData.missingComponents.indexOf(fromComponentId) === -1) {
                            errorData.missingComponents.push(fromComponentId);
                        }
                        if(errorData.componentsWithInvalidInConnections.indexOf(toComponentId) === -1) {
                            errorData.componentsWithInvalidInConnections.push(toComponentId);
                        }
                        errorFound = true;
                    }
                    if(!this.getComponent(toComponentId)) {
                        errorMsg += toComponentId + ' is missing, but there is a connection to it from ' + fromComponentId + '\n';
                        if(errorData.missingComponents.indexOf(toComponentId) === -1) {
                            errorData.missingComponents.push(toComponentId);
                        }
                        if(errorData.componentsWithInvalidOutConnections.indexOf(fromComponentId) === -1) {
                            errorData.componentsWithInvalidOutConnections.push(fromComponentId);
                        }
                        errorFound = true;
                    }
                }
            }
            if(errorFound) {
                _instance.eventAPI.getFunction(_instance.eventAPI.EVT_VALIDATION_FAILED)({
                    message: errorMsg,
                    data: errorData
                });
                throw errorMsg;
            }
        };
    };
})(Metatron);

(function (Metatron) {
    Metatron.CommandExecuter = function (_instance) {
        this.executedCommandStack = [];
        this.undoCommandStack = [];
        this.execute = function (command, remember) {
            var result = command.execute($.extend(true, {}, command.params));
            if (remember) {
                this.executedCommandStack.push(command);
                this.undoCommandStack = [];
            }
            _instance.eventAPI.getFunction(_instance.eventAPI.EVT_EXEC_COMMAND)($.extend(true, {}, command), !remember);
            return result;
        };
        this.undo = function () {
            if (this.executedCommandStack.length > 0) {
                _instance.drawingBoard.deselectAll();
                var command = this.executedCommandStack.pop();
                command.undo($.extend(true, {}, command.params));
                this.undoCommandStack.push(command);
                _instance.eventAPI.getFunction(_instance.eventAPI.EVT_UNDO_COMMAND)($.extend(true, {}, command));
            }
        };
        this.redo = function () {
            if (this.undoCommandStack.length > 0) {
                _instance.drawingBoard.deselectAll();
                var command = this.undoCommandStack.pop();
                command.execute($.extend(true, {}, command.params));
                this.executedCommandStack.push(command);
                _instance.eventAPI.getFunction(_instance.eventAPI.EVT_REDO_COMMAND)($.extend(true, {}, command));
            }
        };
    };
})(Metatron);

(function (Metatron) {

    var Command = function (name, execute, undo, params) {
        this.name = name;
        this.execute = execute;
        this.undo = undo;
        this.params = $.extend(true, {}, params);
    };

    Metatron.Commands = function (_instance) {

        var commands = {
            AddComponentCommand: function (params) {
                var execute = function (params) {
                    return addComponentProcedure(params);
                };
                var undo = function (params) {
                    removeComponentProcedure(params);
                };
                return new Command('Add Component', execute, undo, params);
            },

            RemoveComponentCommand: function (params) {
                var execute = function (params) {
                    removeComponentProcedure(params);
                };
                var undo = function (params) {
                    addComponentProcedure(params);
                };
                return new Command('Remove Component', execute, undo, params);
            },

            MoveComponentCommand: function (params) {
                var execute = function (params) {
                    moveComponentProcedure(params, false);
                };
                var undo = function (params) {
                    moveComponentProcedure(params, true);
                };
                return new Command('Move Component', execute, undo, params);
            },

            RenameComponentCommand: function (params) {
                var execute = function (params) {
                    renameComponentProcedure(params, false);
                };
                var undo = function (params) {
                    renameComponentProcedure(params, true);
                };
                return new Command('Rename Component', execute, undo, params);
            },

            AddConnectionCommand: function (params) {
                var execute = function (params) {
                    addConnectionProcedure(params);
                };
                var undo = function (params) {
                    removeConnectionProcedure(params);
                };
                return new Command('Add Connection', execute, undo, params);
            },

            RemoveConnectionCommand: function (params) {
                var execute = function (params) {
                    removeConnectionProcedure(params);
                };
                var undo = function (params) {
                    addConnectionProcedure(params);
                };
                return new Command('Remove Connection', execute, undo, params);
            },

            ChangeConnectionCommand: function (params) {
                var execute = function (params) {
                    changeConnectionProcedure(params, false);
                };
                var undo = function (params) {
                    changeConnectionProcedure(params, true);
                };
                return new Command('Change Connection', execute, undo, params);
            }
        };

        var addComponentProcedure = function (params) {
            var componentParam = params.component;
            var componentEnity = _instance.entityStore.components[componentParam.id] = componentParam;
            var inboundConnectionsParam = $.extend(true, [], componentParam.inboundConnections);
            var outboundConnectionsParam = $.extend(true, [], componentParam.outboundConnections);
            componentEnity.element = _instance.drawingBoard.drawComponent(componentEnity);
            for (var i = 0; i < inboundConnectionsParam.length; i++) {
                _instance.commandExecuter.execute(new commands.AddConnectionCommand({
                    connection: inboundConnectionsParam[i],
                    animate: true
                }), false);
            }
            for (var i = 0; i < outboundConnectionsParam.length; i++) {
                _instance.commandExecuter.execute(new commands.AddConnectionCommand({
                    connection: outboundConnectionsParam[i],
                    animate: true
                }), false);
            }

            return componentEnity;
        };

        var removeComponentProcedure = function (params) {
            var componentParam = params.component;
            var componentEntity = _instance.entityStore.getComponent(componentParam.id);
            var inboundConnectionsParam = $.extend(true, [], componentParam.inboundConnections);
            var outboundConnectionsParam = $.extend(true, [], componentParam.outboundConnections);
            _instance.drawingBoard.eraseComponent(componentEntity);
            for (var i = 0; i < inboundConnectionsParam.length; i++) {
                _instance.commandExecuter.execute(new commands.RemoveConnectionCommand({
                    connection: inboundConnectionsParam[i],
                    animate: true
                }), false);
            }
            for (var i = 0; i < outboundConnectionsParam.length; i++) {
                _instance.commandExecuter.execute(new commands.RemoveConnectionCommand({
                    connection: outboundConnectionsParam[i],
                    animate: true
                }), false);
            }
            delete _instance.entityStore.components[componentParam.id];
        };

        var moveComponentProcedure = function (params, undo) {
            var componentParam = params.component;
            var componentEntity = _instance.entityStore.getComponent(componentParam.id);
            var displacement = params.displacement;
            componentEntity.position = _instance.drawingBoard.drawComponentMovement(componentEntity, displacement, undo);
            componentEntity.element.drawConnectingPoints(componentEntity);
            _instance.drawingBoard.drawConnectors(componentEntity, false);
        };

        var renameComponentProcedure = function (params, undo) {
            var componentParam = params.component;
            var componentEntity = _instance.entityStore.getComponent(componentParam.id);
            if (undo) {
                componentEntity.displayName = params.oldName;
            } else {
                componentEntity.displayName = params.newName;
            }
            _instance.drawingBoard.drawComponentLabel(componentEntity);
        }

        var addConnectionProcedure = function (params) {
            var connectionParam = params.connection;
            var connectionEntity = _instance.entityStore.connections[connectionParam.id] = connectionParam;
            var fromComponent = _instance.entityStore.getComponent(connectionParam.fromComponentId);
            var toComponent = _instance.entityStore.getComponent(connectionParam.toComponentId);
            if (fromComponent && toComponent) {
                _instance.drawingBoard.drawConnector(connectionEntity, params.animate);
            }
            if (fromComponent) {
                for (var i = 0; i < fromComponent.outboundConnections.length; i++) {
                    if (connectionParam.id === fromComponent.outboundConnections[i].id) {
                        fromComponent.outboundConnections.splice(i, 1);
                        break;
                    }
                }
                fromComponent.outboundConnections.push(connectionEntity);
            }
            if (toComponent) {
                for (var i = 0; i < toComponent.inboundConnections.length; i++) {
                    if (connectionParam.id === toComponent.inboundConnections[i].id) {
                        toComponent.inboundConnections.splice(i, 1);
                        break
                    }
                }
                toComponent.inboundConnections.push(connectionEntity);
            }
            return connectionEntity;
        };

        var removeConnectionProcedure = function (params) {
            var connectionParam = params.connection;
            var connectionEntity = _instance.entityStore.getConnection(connectionParam.id);
            _instance.drawingBoard.eraseConnector(connectionEntity);
            var fromComponent = _instance.entityStore.getComponent(connectionParam.fromComponentId);
            for (var i = 0; i < fromComponent.outboundConnections.length; i++) {
                if (fromComponent.outboundConnections[i].id === connectionParam.id) {
                    fromComponent.outboundConnections.splice(i, 1);
                    break;
                }
            }
            var toComponent = _instance.entityStore.getComponent(connectionParam.toComponentId);
            for (var i = 0; i < toComponent.inboundConnections.length; i++) {
                if (toComponent.inboundConnections[i].id === connectionParam.id) {
                    toComponent.inboundConnections.splice(i, 1);
                    break;
                }
            }
            delete connectionEntity;
        };

        var changeConnectionProcedure = function (params, undo) {
            var connectionParam = params.connection;
            var connectionEntity = _instance.entityStore.getConnection(connectionParam.id);
            if (undo) {
                connectionParam.connectionType = params.oldConnectionType;
            } else {
                connectionParam.connectionType = params.newConnectionType;
            }
            _instance.commandExecuter.execute(new commands.RemoveConnectionCommand({
                connection: connectionEntity,
                animate: false
            }), false);
            _instance.commandExecuter.execute(new commands.AddConnectionCommand({
                connection: connectionParam,
                animate: false
            }), false);
        };

        return commands;
    };
})(Metatron);

(function (Metatron) {
    Metatron.DrawingBoard = function (_instance, parentContainerId, stencilBoxConfig) {
        var parentContainer = $('#' + parentContainerId).html('');
        var containerName = 'drawingboard';
        var connectingPointPlacements = ['top', 'left', 'right', 'bottom', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
        var workspacePaper;
        var toolboxWidth = _instance.editMode ? 170 : 0;
        var menuBarHeight = 30;
        var stencilGap = 5;
        var workspaceHeight = parentContainer.height() - menuBarHeight - 4;
        var workspaceWidth = parentContainer.width() - toolboxWidth - 4;
        var componentWidth = 36;
        var componentHeight = componentWidth;
        var contextMenuAnimEasing = 'easeInOut';
        var contextMenuAnimSpeed = 100;
        var lineDrawAnimSpeed = 500;
        var currentActionMenu = null;
        var viewBoxState = {
            usableMarginWidth: _instance.usableMargin,
            x: 0,
            y: 0,
            width: workspaceWidth,
            height: workspaceHeight
        };
        var getScale = function () {
            return viewBoxState.width / workspaceWidth;
        };
        var selectedItems = {
            components: {},
            connections: {}
        };
        var generalStyles = {
            fill: '#F6F6F6',
            stroke: '#CECECE',
            'stroke-width': '1'
        };
        var potentialConnectingPoint;
        var uiBlocker;
        var gridElements = [];

        function init() {
            addFonts();
            if (_instance.editMode) {
                this.toolboxContainer = createToolboxContainer();
                createToolbox(this.toolboxContainer);
            }
            menubarContainer = createMenubarContainer();
            this.worspaceContainer = createWorkspaceContainer();
            createMenubar(menubarContainer);
            createWorkspace(this.worspaceContainer);
            parentContainer.bind('contextmenu', function (e) {
                return false;
            });
            this.worspaceContainer.bind('mousedown', function (e) {
                deselectAll();
            });
            initalizeParentContainer();
        }

        function initalizeParentContainer() {
            parentContainer.css('overflow', 'hidden');
            parentContainer.css('height', parentContainer.height());
            parentContainer.css('width', parentContainer.width());
        };

        function addFonts() {
            parentContainer.prepend('<style type="text/css"> @font-face {font-family:"Roboto-Regular"; src: url("scp-metatron/fonts/Roboto-Regular.ttf");</style>');
        }

        function createToolboxContainer() {
            var containerIdentifier = parentContainerId + '_toolbox';
            var container = $('<div>');
            container.addClass('toolbox');
            container.attr('id', containerIdentifier);
            container.css('float', 'left');
            container.css('background-color', '#F9F9F9');
            container.css('border', '1px solid #E3E3E3');
            container.css('width', toolboxWidth);
            container.css('height', parentContainer.height() - 2);
            parentContainer.append(container);
            return container;
        }

        function createMenubarContainer() {
            var containerIdentifier = parentContainerId + '_menubar';
            var container = $('<div>');
            container.addClass('menubar');
            container.attr('id', containerIdentifier);
            container.css('float', 'left');
            container.css('background-color', '#F9F9F9');
            container.css('border', '1px solid #E3E3E3');
            container.css('width', parentContainer.width() - toolboxWidth - 4);
            container.css('height', menuBarHeight);
            parentContainer.append(container);
            return container;
        }

        function createWorkspaceContainer() {
            var containerIdentifier = parentContainerId + '_workspace';
            var container = $('<div>');
            container.addClass('workspace');
            container.attr('id', containerIdentifier);
            container.css('float', 'left');
            container.css('overflow', 'hidden');
            container.css('background-color', '#F9F9F9');
            container.css('border', '1px solid #E3E3E3');
            container.css('width', parentContainer.width() - toolboxWidth - 4);
            container.css('height', parentContainer.height() - menuBarHeight - 4);
            parentContainer.append(container);
            return container;
        }

        function createToolbox(toolboxContainer) {

            var toolboxLabel = $('<div>');
            toolboxLabel.text('Toolbox');
            toolboxLabel.css('font-family', 'Roboto-Regular');
            toolboxLabel.css('font-size', 13);
            toolboxLabel.css('color', '#aaa');
            toolboxLabel.css('margin-top', 10);
            toolboxLabel.css('margin-left', 10);
            toolboxLabel.css('margin-bottom', 40);
            toolboxContainer.append(toolboxLabel);

            for (var i = 0; i < stencilBoxConfig.stencils.length; i++) {
                if (!stencilBoxConfig.stencils[i].hidden) {
                    var stencil = $('<div>');
                    stencil.addClass('stencil');
                    stencil.css('width', toolboxWidth - 2);
                    stencil.css('height', componentHeight);
                    stencil.css('margin-bottom', 6);
                    toolboxContainer.append(stencil);

                    var stencilImage = $('<div>');
                    stencilImage.css('width', componentWidth);
                    stencilImage.css('height', componentHeight);
                    stencilImage.css('float', 'left');
                    stencilImage.css('margin-left', 10);
                    stencilImage.css('background-image', 'url("' + stencilBoxConfig.stencils[i].imgPath + '")');
                    stencilImage.attr('draggable', 'true');
                    stencilImage.attr('stencilId', stencilBoxConfig.stencils[i].id);
                    stencilImage.css('cursor', 'move');
                    stencilImage.bind('dragstart', function (e) {
                        e.stencilId = $(this).attr('stencilId');
                        stencilDragEvent = e;
                    });
                    stencil.append(stencilImage);

                    var stencilLabel = $('<div>');
                    stencilLabel.text(stencilBoxConfig.stencils[i].name);
                    stencilImage.css('float', 'left');
                    stencilLabel.css('width', 'auto');
                    stencilLabel.css('font-family', 'Roboto-Regular');
                    stencilLabel.css('font-size', 12);
                    stencilLabel.css('color', '#aaa');
                    stencilLabel.css('margin-top', 6);
                    stencilLabel.css('margin-left', 15);
                    stencilLabel.css('display', 'inline-block');
                    stencil.append(stencilLabel);
                }
            }
        }

        function createMenubar(menubarContainer) {

            menubarContainer.html('');

            var menuItems;
            if (_instance.editMode) {
                menuItems = _instance.editModeMenuItems;
            } else {
                menuItems = _instance.observerModeMenuItems;
            }
            for (var i = 0; i < menuItems.length; i++) {
                var menuItem = $('<div>');
                menuItem.css('float', 'left');
                menuItem.css('width', menuBarHeight);
                menuItem.css('height', menuBarHeight);
                menuItem.css('background-image', 'url("' + menuItems[i].icon + '")');
                menuItem.css('cursor', 'pointer');
                menuItem.bind('click', menuItems[i].function);
                menubarContainer.append(menuItem);
            }
        }

        function createWorkspace(workspaceContainer) {
            _instance.instancePaper = Raphael(document.getElementById(workspaceContainer.attr('id')), parentContainer.width() - toolboxWidth - 4, parentContainer.height() - menuBarHeight - 4);
            _instance.instancePaper.canvas.onclick = function (e) {
                _instance.eventAPI.getFunction(_instance.eventAPI.EVT_CANVAS_CLICK)(e);
            };
            this.workspace = _instance.instancePaper.rect(0, 0, workspaceWidth + (viewBoxState.usableMarginWidth * 2), workspaceHeight + (viewBoxState.usableMarginWidth * 2));
            this.workspace.attr({
                'stroke': '#DEE',
                'stroke-width': 7,
                'stroke-dasharray': "-.."
            });

            if(_instance.showGrid) {
                showGrid();
            }

            $('#' + parentContainerId + '_workspace').bind('dragover', function (e) {
                e.preventDefault();
            });
            $('#' + parentContainerId + '_workspace').bind('drop', function (e) {
                e.preventDefault();
                if (stencilDragEvent) {
                    var newComponent = _instance.util.createComponent(_instance.entityStore.getStencilConfig(stencilDragEvent.stencilId), _instance.util.alignCoordinateToGrid(e.originalEvent.layerX - stencilDragEvent.originalEvent.offsetX + viewBoxState.x), _instance.util.alignCoordinateToGrid(e.originalEvent.layerY - stencilDragEvent.originalEvent.offsetY + viewBoxState.y));
                    var addedComponent = _instance.entityStore.addComponent(newComponent);
                    selectSingleItem(addedComponent);
                    stencilDragEvent = null;
                }
            });

            //Original reference found in a StackOverflow answer:
            //http://stackoverflow.com/a/9121092/895491
            var paper = _instance.instancePaper;
            var viewBoxWidth = paper.width;
            var viewBoxHeight = paper.height;
            var canvasID = '#' + parentContainerId + '_workspace';
            var startX, startY;
            var mousedown = false;
            var dX, dY;
            var eX, eY;
            var oX = 0,
                oY = 0,
                oWidth = viewBoxWidth,
                oHeight = viewBoxHeight;
            var viewBox = paper.setViewBox(oX, oY, viewBoxWidth, viewBoxHeight);
            viewBox.X = oX;
            viewBox.Y = oY;

            /** This is high-level function.
             * It must react to delta being more/less than zero.
             */
            function handle(delta) {
                vBHo = viewBoxHeight;
                vBWo = viewBoxWidth;
                if (delta < 0) {
                    viewBoxWidth *= 0.95;
                    viewBoxHeight *= 0.95;
                } else {
                    viewBoxWidth *= 1.05;
                    viewBoxHeight *= 1.05;
                }

                viewBox.X -= (viewBoxWidth - vBWo) / 2;
                viewBox.Y -= (viewBoxHeight - vBHo) / 2;

                viewBoxState.x = viewBox.X;
                viewBoxState.y = viewBox.Y;
                viewBoxState.width = viewBoxWidth;
                viewBoxState.height = viewBoxHeight;

                paper.setViewBox(viewBox.X, viewBox.Y, viewBoxWidth, viewBoxHeight);
            }
            /** Event handler for mouse wheel event.
             */
            function wheel(event) {
                //                var delta = 0;
                //                if (!event) { /* For IE. */
                //                    event = window.event;
                //                }
                //                if (event.wheelDelta) { /* IE/Opera. */
                //                    delta = -event.wheelDelta / 120;
                //                } else if (event.detail) { /** Mozilla case. */
                //                    /** In Mozilla, sign of delta is different than in IE.
                //                     * Also, delta is multiple of 3.
                //                     */
                //                    delta = event.detail / 3;
                //                }
                //                /** If delta is nonzero, handle it.
                //                 * Basically, delta is now positive if wheel was scrolled down,
                //                 * and negative, if wheel was scrolled up.
                //                 */
                //                if (delta) {
                //                    handle(delta);
                //                }
                //                /** Prevent default actions caused by mouse wheel.
                //                 * That might be ugly, but we handle scrolls somehow
                //                 * anyway, so don't bother here..
                //                 */
                //                if (event.preventDefault) {
                //                    event.preventDefault();
                //                }
                //                event.returnValue = false;
            }
            /**
             * Initialization code. 
             */
            if (window.addEventListener)
                /** DOMMouseScroll is for mozilla. */
                window.addEventListener('DOMMouseScroll', wheel, false);
            /** IE/Opera. */
            window.onmousewheel = document.onmousewheel = wheel;
            //Pan
            $(canvasID).mousedown(function (e) {
                if (paper.getElementByPoint(e.pageX, e.pageY) !== null) {
                    return;
                }
                mousedown = true;
                startX = e.pageX;
                startY = e.pageY;
                eX = null;
                eY = null;
            });
            $(canvasID).mousemove(function (e) {
                if (mousedown === false) {
                    return;
                }

                dX = startX - e.pageX;
                dY = startY - e.pageY;
                x = viewBoxWidth / paper.width;
                y = viewBoxHeight / paper.height;
                dX *= x;
                dY *= y;

                if ((viewBox.X + dX) < 0) {
                    viewBoxState.x = 0;
                    eX = !eX ? dX : eX;
                    dX = eX;
                } else if ((viewBox.X + dX) > viewBoxState.usableMarginWidth * 2) {
                    viewBoxState.x = viewBoxState.usableMarginWidth * 2;
                    eX = !eX ? dX : eX;
                    dX = eX;
                } else {
                    viewBoxState.x = viewBox.X + dX;
                }

                if ((viewBox.Y + dY) < 0) {
                    viewBoxState.y = 0;
                    eY = !eY ? dY : eY;
                    dY = eY;
                } else if ((viewBox.Y + dY) > viewBoxState.usableMarginWidth * 2) {
                    viewBoxState.y = viewBoxState.usableMarginWidth * 2;
                    eY = !eY ? dY : eY;
                    dY = eY;
                } else {
                    viewBoxState.y = viewBox.Y + dY;
                }

                viewBoxState.width = viewBoxWidth;
                viewBoxState.height = viewBoxHeight;

                document.getSelection().removeAllRanges();

                paper.setViewBox(viewBoxState.x, viewBoxState.y, viewBoxWidth, viewBoxHeight);
            });
            $(window).mouseup(function (e) {
                if (mousedown === false) return;
                viewBox.X = viewBoxState.x;
                viewBox.Y = viewBoxState.y;
                mousedown = false;
            });

        }

        function showGrid(width) {
            gridElements = [];
            var strokeWidth = width || 0.6;
            for (var i = 4; i < workspaceWidth + (viewBoxState.usableMarginWidth * 2); i += _instance.gridSpacing) {
                var pathPrefix = 'M ' + i + ',' + 0 + ' ' + 'L ';
                var path = pathPrefix + ' ' + i + ',' + workspaceHeight + (viewBoxState.usableMarginWidth * 2);
                var line = _instance.instancePaper.path(path);
                line.attr({
                    'stroke-width': strokeWidth,
                    stroke: '#DEE'
                });
                gridElements.push(line);
            }

            for (var i = 4; i < workspaceHeight + (viewBoxState.usableMarginWidth * 2); i += _instance.gridSpacing) {
                var pathPrefix = 'M ' + 0 + ',' + i + ' ' + 'L ';
                var path = pathPrefix + ' ' + workspaceWidth + (viewBoxState.usableMarginWidth * 2) + ',' + i;
                var line = _instance.instancePaper.path(path);
                line.attr({
                    'stroke-width': strokeWidth,
                    stroke: '#dddddd'
                });
                line.toBack();
                gridElements.push(line);
            }
        }

        function hideGrid() {
            for(var i = 0; i < gridElements.length; i++) {
                gridElements[i].remove();
            }
        }

        function blockUI() {
            //to be implemented
        }

        function unblockUI() {
            //to be implemented
        }

        function getZoomScale() {
            return _instance.instancePaper._vbSize || (1 / _instance.instancePaper._viewBoxShift.scale);
        }

        function loadStencilBoxConfig() {
            for (var i = 0; i < stencilBoxConfig.stencils.length; i++) {
                drawStencil(stencilBoxConfig.stencils[i], stencilGap, stencilStartY + (i * stencilGap) + (i * componentHeight));
            }
        }

        function drawComponent(component) {
            var set = _instance.instancePaper.set();
            var rect = _instance.instancePaper.rect(component.position.x, component.position.y, componentWidth, componentHeight);
            rect.workspace = this.workspace;
            drawComponentLabel(component, rect);

            set.draggable = function () {
                var start = function () {
                    this.o().toFront();
                    if (this.connectingPoints && this.drawConnectingPoints) {
                        this.drawConnectingPoints(component);
                    }
                    selectSingleItem(component);
                };
                var move = function (dx, dy) {
                    var scale = getZoomScale();
                    this.dx = dx;
                    this.dy = dy;
                    var x = this.ox + (dx * scale);
                    var y = this.oy + (dy * scale);
                    var toolBoxX = 0;

                    x = Math.max(Math.min(x, rect.workspace.getABox().topRight.x - componentWidth), rect.workspace.getABox().topLeft.x);
                    y = Math.max(Math.min(y, rect.workspace.getABox().bottomRight.y - componentHeight), rect.workspace.getABox().topRight.y);

                    if (!this.startingX && !this.startingY) {
                        this.startingX = x;
                        this.startingY = y;
                    }

                    x = _instance.util.alignCoordinateToGrid(x);
                    y = _instance.util.alignCoordinateToGrid(y);

                    this.currentX = x;
                    this.currentY = y;

                    drawComponentMovement(component, {
                        endingX: this.currentX,
                        endingY: this.currentY,
                        startingX: this.startingX,
                        startingY: this.startingY
                    });

                    if (this.connectingPoints && this.drawConnectingPoints) {
                        this.drawConnectingPoints(component);
                    }
                    drawConnectors(component, false);
                    selectSingleItem(component);
                };
                var end = function (e) {

                    if (this.startingX && this.startingY && this.currentX && this.currentY && !(this.startingX === this.currentX && this.startingY === this.currentY)) {
                        _instance.commandExecuter.execute(new _instance.commands.MoveComponentCommand({
                            component: component,
                            displacement: {
                                endingX: this.currentX,
                                endingY: this.currentY,
                                startingX: this.startingX,
                                startingY: this.startingY
                            }
                        }), true);
                    }
                    delete this.currentX;
                    delete this.currentY;
                    delete this.startingX;
                    delete this.startingY;
                    selectSingleItem(component);
                    if (e.which === 3) {
                        this.showComponentActionsMenu(component);
                    }
                };

                this.drag(move, start, end);
                return this;
            };

            rect.drawConnectingPoints = drawConnectingPoints;
            rect.showComponentActionsMenu = showComponentActionsMenu;

            set.drawConnectingPoints = function (component) {
                for (var i = 0, j = this.items.length; i < j; i++) {
                    this.items[i].drawConnectingPoints(component);
                }
                return this;
            }

            set.push(rect).drawConnectingPoints(component);
            var cursorType = 'pointer';
            if (_instance.editMode) {
                set.draggable();
                cursorType = 'move';
            }

            set.attr({
                fill: 'url("' + _instance.entityStore.getStencilConfig(component.stencilId).imgPath + '")',
                stroke: 'none',
                cursor: cursorType,
                repeat: 'none'
            });

            set.mousedown(function (e) {
                e.stopPropagation();
                if (!_instance.clickCount) {
                    _instance.clickCount = 1;
                    setTimeout(function() {
                        if(_instance.clickCount === 1) {
                            _instance.eventAPI.getFunction(_instance.eventAPI.EVT_CMP_CLICK)(component);
                        } else {
                            _instance.eventAPI.getFunction(_instance.eventAPI.EVT_CMP_DBL_CLICK)(component);
                        }
                        _instance.clickCount = 0;
                    }, 200);
                } else {
                    _instance.clickCount++;
                }
            });

            set.mouseup(function () {
                if (!_instance.editMode) {
                    selectSingleItem(component);
                }
            });

            return set;
        }

        function drawComponentLabel(component, componentElement) {
            if (component.labelElement) {
                component.labelElement.remove();
            }
            var set = _instance.instancePaper.set();
            var labelText = component.displayName;
            var labelLength = labelText.length * 4.5;
            component.labelElement = _instance.instancePaper.text(componentElement.attrs.x + (componentHeight / 2) - (labelLength / 2), componentElement.attrs.y + componentHeight - 9, labelText).attr({
                fill: '#888',
                'font-size': 10,
                'text-anchor': 'start',
                'font-family': 'Roboto-Regular'
            });
        }

        function showComponentActionsMenu(component) {
            var componentBox = this.getABox();
            var set = this.paper.set();
            var actionItemHeight = 17;
            var stencilConfig = _instance.entityStore.getStencilConfig(component.stencilId);
            var leftMargin = 12;

            for (var i = 0; i < stencilConfig.actions.length; i++) {
                var menuItem = this.paper.rect(componentBox.topRight.x + leftMargin, componentBox.topRight.y + (i * actionItemHeight), actionItemHeight * 4, 0);
                menuItem.attr({
                    'stroke': 'none',
                    'fill': '#212121',
                    'opacity': 0.7,
                    'cursor': 'pointer'
                });

                var animSpeed = contextMenuAnimSpeed;
                var anim = Raphael.animation({
                    height: actionItemHeight
                }, animSpeed, contextMenuAnimEasing);
                menuItem.animate(anim.delay(animSpeed * i));

                menuItem.mouseout(function () {
                    this.attr({
                        'fill': '#212121'
                    });
                });

                menuItem.mouseover(function () {
                    this.attr({
                        'fill': '#303030'
                    });
                });

                menuItem.mouseout(function () {
                    this.attr({
                        'fill': '#212121'
                    });
                });

                menuItem.executerFunction = stencilConfig.actions[i].executerFunction;

                menuItem.mousedown(function () {
                    this.executerFunction(component);
                });

                if (i < stencilConfig.actions.length - 1) {
                    var gap = 5;
                    var seperator = this.paper.path('M ' + ' ' + (componentBox.topRight.x + leftMargin + gap) + ',' + (componentBox.topRight.y + ((i + 1) * actionItemHeight)) + ' L ' + (componentBox.topRight.x + (actionItemHeight * 4) + leftMargin - gap) + ',' + (componentBox.topRight.y + ((i + 1) * actionItemHeight)));
                    seperator.attr({
                        'stroke': '#F1F1F1',
                        opacity: 0
                    });

                    set.push(seperator);

                    var seperatorAnim = Raphael.animation({
                        opacity: 1
                    }, 0);
                    seperator.animate(seperatorAnim.delay((animSpeed * i) + animSpeed * 0.6));
                }

                var actionTitle = this.paper.text(componentBox.topRight.x + leftMargin + 10, componentBox.topRight.y + (i * actionItemHeight) + 8, stencilConfig.actions[i].displayName).attr({
                    'font-size': 10,
                    'text-anchor': 'start',
                    'cursor': 'pointer',
                    'font-family': 'Roboto-Regular',
                    opacity: 0,
                    'fill': '#F1F1F1'
                });

                var titleAnim = Raphael.animation({
                    opacity: 1
                }, 0);
                actionTitle.animate(titleAnim.delay((animSpeed * i) + animSpeed * 0.6));

                actionTitle.menuItem = menuItem;

                actionTitle.mouseover(function () {
                    this.menuItem.attr({
                        'fill': '#303030'
                    });
                });

                actionTitle.mouseout(function () {
                    this.menuItem.attr({
                        'fill': '#212121'
                    });
                });

                actionTitle.mousedown(function () {
                    this.menuItem.executerFunction(component);
                });

                set.push(menuItem);
                set.push(actionTitle);
            }

            currentActionMenu = set;
        }

        function showConnectionActionsMenu(connection, event) {
            var componentBox = connection.element.attrs.path[0];
            var set = connection.element.paper.set();
            var actionItemHeight = 17;
            var fromComponent = _instance.entityStore.getComponent(connection.fromComponentId);
            var stencilConfig = _instance.entityStore.getStencilConfig(fromComponent.stencilId);
            var connectorConfigs = _instance.entityStore.getStencilConfig(stencilConfig.id).outboundConnectorConfigs;
            var leftMargin = 12;

            for (var i = 0; i < connectorConfigs.length; i++) {

                var limitReached = false;
                var existingConnections = {};
                for (var j = 0; j < fromComponent.outboundConnections.length; j++) {
                    if (!existingConnections[fromComponent.outboundConnections[j].connectionType]) {
                        existingConnections[fromComponent.outboundConnections[j].connectionType] = 0;
                    }
                    existingConnections[fromComponent.outboundConnections[j].connectionType]++;
                }
                if (existingConnections[connectorConfigs[i].type] && existingConnections[connectorConfigs[i].type] === connectorConfigs[i].maxCount) {
                    limitReached = true;
                }

                var menuItem = connection.element.paper.rect(event.offsetX + leftMargin + viewBoxState.x, event.offsetY + (i * actionItemHeight) + viewBoxState.y, actionItemHeight * 5, 0);
                menuItem.attr({
                    'stroke': 'none',
                    'fill': '#212121',
                    'opacity': 0.7
                });

                var animSpeed = contextMenuAnimSpeed;
                var anim = Raphael.animation({
                    height: actionItemHeight
                }, animSpeed, contextMenuAnimEasing);
                menuItem.animate(anim.delay(animSpeed * i));

                menuItem.mouseout(function () {
                    this.attr({
                        'fill': '#212121'
                    });
                });

                if (i < connectorConfigs.length - 1) {
                    var gap = 5;
                    var seperator = connection.element.paper.path('M ' + ' ' + (event.offsetX + leftMargin + gap + viewBoxState.x) + ',' + (event.offsetY + ((i + 1) * actionItemHeight) + viewBoxState.y) + ' L ' + (event.offsetX + (actionItemHeight * 5) + leftMargin - gap + viewBoxState.x) + ',' + (event.offsetY + ((i + 1) * actionItemHeight) + viewBoxState.y));
                    seperator.attr({
                        'stroke': '#F1F1F1',
                        opacity: 0
                    });

                    set.push(seperator);

                    var seperatorAnim = Raphael.animation({
                        opacity: 1
                    }, 0);
                    seperator.animate(seperatorAnim.delay((animSpeed * i) + animSpeed * 0.6));
                }

                var actionTitle = connection.element.paper.text(event.offsetX + leftMargin + 6 + viewBoxState.x, event.offsetY + (i * actionItemHeight) + 8 + viewBoxState.y, connectorConfigs[i].defaultLabel ? connectorConfigs[i].defaultLabel : connectorConfigs[i].type).attr({
                    'font-size': 10,
                    'text-anchor': 'start',
                    'font-family': 'Roboto-Regular',
                    opacity: 0
                });

                var titleAnim = Raphael.animation({
                    opacity: 1
                }, 0);
                actionTitle.animate(titleAnim.delay((animSpeed * i) + animSpeed * 0.6));

                actionTitle.menuItem = menuItem;


                actionTitle.mouseout(function () {
                    this.menuItem.attr({
                        'fill': '#212121'
                    });
                });

                if (!limitReached) {
                    menuItem.attr({
                        'cursor': 'pointer'
                    });
                    actionTitle.attr({
                        'cursor': 'pointer',
                        'fill': '#F1F1F1'
                    });
                    menuItem.mouseover(function () {
                        this.attr({
                            'fill': '#303030'
                        });
                    });
                    actionTitle.mouseover(function () {
                        this.menuItem.attr({
                            'fill': '#303030'
                        });
                    });
                    menuItem.connectionType = connectorConfigs[i].type;
                    menuItem.mousedown(function () {
                        _instance.entityStore.changeConnectionType(connection, this.connectionType);
                    });
                    actionTitle.connectionType = connectorConfigs[i].type;
                    actionTitle.mousedown(function () {
                        _instance.entityStore.changeConnectionType(connection, this.connectionType);
                    });
                } else {
                    menuItem.attr({
                        'cursor': 'default'
                    });
                    actionTitle.attr({
                        'fill': '#898989',
                        'cursor': 'default'
                    });
                    actionTitle.attr({
                        'text': actionTitle.attr('text') + ' [used]'
                    });
                }

                set.push(menuItem);
                set.push(actionTitle);
            }

            currentActionMenu = set;
        }

        function redrawIndicators(component) {
            if (!_instance.editMode) {
                var componentBox = component.element[0].getABox();
                var set = _instance.instancePaper.set();
                var indicatorWidth = 12;
                var stencilConfig = _instance.entityStore.getStencilConfig(component.stencilId);

                for (var j = 0; j < component.indicators.length; j++) {
                    for (var i = 0; i < stencilConfig.indicators.length; i++) {
                        if (stencilConfig.indicators[i].name === component.indicators[j].name && stencilConfig.indicators[i].iconPath.length > 0) {
                            var componentNameLength = component.labelElement[0].textContent.length * 5;
                            var element = _instance.instancePaper.rect(componentBox.bottom.x - (indicatorWidth * (j + 1)) - (componentNameLength / 2), componentBox.bottomRight.y - 14.7, indicatorWidth, indicatorWidth);
                            element.attr({
                                fill: 'url("' + stencilConfig.indicators[i].iconPath + '")',
                                stroke: 'none'
                            });
                            set.push(element);

                            var tpText = _instance.instancePaper.text(5, 5, stencilConfig.indicators[i].displayName).attr({
                                fill: '#949494',
                                'font-size': 10,
                                'text-anchor': 'start',
                                'font-family': 'Roboto-Regular'
                            });
                            element.tooltip(tpText, parentContainer, viewBoxState);

                            element.blink = function () {
                                if (this.opacity === 1) {
                                    this.opacity = 0;
                                } else {
                                    this.opacity = 1;
                                }
                                this.animate(Raphael.animation({
                                    opacity: this.opacity
                                }, 400, 'easeInOut', this.blink), 1);
                            };

                            if (stencilConfig.indicators[i].blink || true) { //all set to blink... for now..?
                                element.blink();
                            }

                            component.indicators[j].element = element;
                            break;
                        }
                    }
                }
            }
        }

        function clearAllIndicators() {
            for (var componentId in _instance.entityStore.components) {
                if (_instance.entityStore.components.hasOwnProperty(componentId)) {
                    var component = _instance.entityStore.getComponent(componentId);
                    eraseIndicators(component);
                    component.indicators = [];
                }
            }
        }

        function removeIndicators(component) {
            if (component) {
                eraseIndicators(component);
                component.indicators = [];
            }
        }

        function eraseIndicators(component) {
            for (var j = 0; j < component.indicators.length; j++) {
                if (component.indicators[j].element) {
                    component.indicators[j].element.remove();
                    delete component.indicators[j].element;
                }
            }
        }

        function containsIndicator(component, indicatorName) {
            if (component) {
                for (var i = 0; i < component.indicators.length; i++) {
                    if (component.indicators[i].name === indicatorName) {
                        return true;
                    }
                }
                return false;
            }
        }

        function addIndicator(component, indicatorName) {
            if (component && !containsIndicator(component, indicatorName)) {
                eraseIndicators(component);
                component.indicators.push({
                    name: indicatorName
                });
                redrawIndicators(component);
            }
        }

        function removeIndicator(component, indicatorName) {
            if (component) {
                eraseIndicators(component);
                for (var i = 0; i < component.indicators.length; i++) {
                    if (component.indicators[i].name === indicatorName) {
                        component.indicators.splice(i, 1);
                        break;
                    }
                }
                redrawIndicators(component);
            }
        }

        function toggleIndicator(component, indicatorName) {
            if (!containsIndicator(component, indicatorName)) {
                addIndicator(component, indicatorName);
            } else {
                removeIndicator(component, indicatorName);
            }
        }

        function drawConnectingPoints(component) {

            var componentBox = this.getABox();
            var stencilConfig = _instance.entityStore.getStencilConfig(component.stencilId);

            this.aniOptions = {
                duration: 300,
                easing: 'backOut'
            };

            if (!this.connectingPoints) {

                var connectingPointMeta = {
                    set: this.paper.set()
                };

                for (var i = 0; i < connectingPointPlacements.length; i++) {
                    var placement = connectingPointPlacements[i];
                    connectingPointMeta.set.push(connectingPointMeta[placement] = drawConnectingPoint(placement, componentBox, this));
                    connectingPointMeta[placement].set = connectingPointMeta.set;
                }

                connectingPointMeta.set.hide().style('base', 'connectorDots', this.aniOptions).toFront();

                this.mouseover(function () {
                    var outboundConnectorMaxCount = 0;
                    for (var i = 0; i < stencilConfig.outboundConnectorConfigs.length; i++) {
                        outboundConnectorMaxCount += stencilConfig.outboundConnectorConfigs[i].maxCount;
                    }
                    if ((component.inboundConnections.length < stencilConfig.inboundConnectorConfigs.maxCount || component.outboundConnections.length < outboundConnectorMaxCount) && _instance.editMode) {
                        connectingPointMeta.set.show().style('show');
                    }
                });
                this.mouseout(function () {
                    connectingPointMeta.set.style('base');
                });
                this.drag(
                    function () {
                        connectingPointMeta.set.hide();
                    },
                    function () {
                        connectingPointMeta.set.hide();
                    },
                    function () {
                        connectingPointMeta.set.show()
                    }
                );

                connectingPointMeta.set.mouseover(function () {
                    this.set.attr({
                        'cursor': 'initial'
                    });
                    var outboundConnectorMaxCount = 0;
                    for (var i = 0; i < stencilConfig.outboundConnectorConfigs.length; i++) {
                        outboundConnectorMaxCount += stencilConfig.outboundConnectorConfigs[i].maxCount;
                    }
                    if ((component.inboundConnections.length < stencilConfig.inboundConnectorConfigs.maxCount || component.outboundConnections.length < outboundConnectorMaxCount) && _instance.editMode) {
                        potentialConnectingPoint = {
                            connectionPoint: this,
                            component: component
                        };
                        this.set.style('show');
                        this.style('over');
                        this.set.attr({
                            'cursor': 'crosshair'
                        });
                    }
                });
                connectingPointMeta.set.mouseout(function () {
                    potentialConnectingPoint = null;
                    this.set.style('base');
                });

                handleConnectorDrag(connectingPointMeta, component);

                this.connectingPoints = connectingPointMeta;

            } else {

                var connectingPointMeta = this.connectingPoints;

                for (var i = 0; i < connectingPointPlacements.length; i++) {
                    var placement = connectingPointPlacements[i];
                    connectingPointMeta[placement].attr({
                        cx: componentBox[placement].x,
                        cy: componentBox[placement].y
                    });
                }

                connectingPointMeta.set.toFront();
            }

            return this;
        }

        function handleConnectorDrag(connectingPoint, component) {

            var connectingPointSet = connectingPoint.set;
            var stencilConfig = _instance.entityStore.getStencilConfig(component.stencilId);

            var pathPrefix;
            var line;
            var outboundConnectionLimitReached;
            var inboundConnectionLimitReached;

            var start = function () {
                selectSingleItem(component);
                pathPrefix = 'M ' + this.attrs.cx + ',' + this.attrs.cy + ' ' + 'L ';
                var outboundConnectorMaxCount = 0;
                for (var i = 0; i < stencilConfig.outboundConnectorConfigs.length; i++) {
                    outboundConnectorMaxCount += stencilConfig.outboundConnectorConfigs[i].maxCount;
                }
                outboundConnectionLimitReached = component.outboundConnections.length === outboundConnectorMaxCount;
            };
            var move = function (dx, dy) {

                if (outboundConnectionLimitReached) {
                    return;
                }

                if (line) {
                    line.remove();
                }

                var x;
                var y;

                var scale = getZoomScale();

                //clip to point
                if (potentialConnectingPoint && potentialConnectingPoint.connectionPoint.set !== connectingPointSet) {
                    x = potentialConnectingPoint.connectionPoint.attrs.cx;
                    y = potentialConnectingPoint.connectionPoint.attrs.cy;
                } else {
                    x = this.attrs.cx + (dx * scale);
                    y = this.attrs.cy + (dy * scale);
                }

                var path = pathPrefix + ' ' + x + ',' + y;
                line = this.paper.path(path);
                line.attr({
                    'stroke-width': 1.6,
                    stroke: '#dddddd'
                });
                this.style('connecting');
            };
            var end = function () {

                if (outboundConnectionLimitReached) {
                    return;
                }

                if (line) {
                    line.remove();
                }

                if (potentialConnectingPoint && potentialConnectingPoint.connectionPoint.set !== connectingPointSet) {
                    inboundConnectionLimitReached = potentialConnectingPoint.component.inboundConnections.length === _instance.entityStore.getStencilConfig(potentialConnectingPoint.component.stencilId).inboundConnectorConfigs.maxCount;
                    if (!inboundConnectionLimitReached) {
                        var newConnection = _instance.util.createConnection(component.id, this.placement, potentialConnectingPoint.component.id, potentialConnectingPoint.connectionPoint.placement);
                        _instance.entityStore.addConnection(newConnection);
                    }
                }
                this.style('base');
            };

            connectingPointSet.mousedown(function (e) {
                e.stopPropagation();
            });
            connectingPointSet.drag(move, start, end);
        }

        function selectSingleItem(item) {
            deselectAll();
            selectItem(item);
        }

        function selectMultipleItems(items) {
            deselectAll();
            for (var i = 0; i < items.length; i++) {
                selectItem(items[i]);
            }
        }

        function deleteSelection() {
            removeAllSelectedEffects();
            for (var selectedComponentId in selectedItems.components) {
                if (selectedItems.components.hasOwnProperty(selectedComponentId)) {
                    var component = selectedItems.components[selectedComponentId];
                    _instance.entityStore.removeComponent(component);
                }
            }
            for (var selectedConnectionId in selectedItems.connections) {
                if (selectedItems.connections.hasOwnProperty(selectedConnectionId)) {
                    _instance.entityStore.removeConnection(selectedItems.connections[selectedConnectionId]);
                }
            }
            selectedItems.components = {};
            selectedItems.connections = {};
        }

        function deselectAll() {
            if (currentActionMenu) {
                currentActionMenu.remove();
                currentActionMenu = null;
            }
            removeAllSelectedEffects();
            selectedItems.components = {};
            selectedItems.connections = {};
        }

        function removeAllSelectedEffects() {
            for (var selectedComponentId in selectedItems.components) {
                if (selectedItems.components.hasOwnProperty(selectedComponentId)) {
                    selectedItems.components[selectedComponentId].element.glowEffect.remove();
                }
            }
            for (var selectedConnectionId in selectedItems.connections) {
                if (selectedItems.connections.hasOwnProperty(selectedConnectionId)) {
                    selectedItems.connections[selectedConnectionId].element.glowEffect.remove();
                }
            }
        }

        function selectItem(item) {
            if (item.type === 'component') {
                selectedItems.components[item.id] = item;
            } else if (item.type === 'connection') {
                selectedItems.connections[item.id] = item;
            }
            item.element.glowEffect = item.element.glow({
                width: 10,
                fill: true,
                color: '#DDDDDD'
            });
        }

        function drawConnectingPoint(placement, elementBox, element) {
            var connectingPoint = _instance.instancePaper.circle(1, 1, 3).attr({
                cx: elementBox[placement].x,
                cy: elementBox[placement].y
            });
            connectingPoint.placement = placement;
            return connectingPoint;
        }

        function drawpath(canvas, pathstr, duration, attr, callback) {
            var guide_path = canvas.path(pathstr).attr({
                stroke: "none",
                fill: "none"
            });
            var path = canvas.path(guide_path.getSubpath(0, 1)).attr(attr);
            var total_length = guide_path.getTotalLength(guide_path);
            var last_point = guide_path.getPointAtLength(0);
            var start_time = new Date().getTime();
            var interval_length = 50;
            var result = path;

            var interval_id = setInterval(function () {
                var elapsed_time = new Date().getTime() - start_time;
                var this_length = elapsed_time / duration * total_length;
                var subpathstr = guide_path.getSubpath(0, this_length);
                attr.path = subpathstr;

                path.animate(attr, interval_length);
                if (elapsed_time >= duration) {
                    clearInterval(interval_id);
                    if (callback != undefined) callback();
                    guide_path.remove();
                }
            }, interval_length);
            return result;
        }

        function drawConnector(connection, animate) {
            var fromConnectingPoint = _instance.entityStore.getComponent(connection.fromComponentId).element[0].connectingPoints[connection.fromPlacement];
            var toConnectingPoint = _instance.entityStore.getComponent(connection.toComponentId).element[0].connectingPoints[connection.toPlacement];

            if (connection.element && connection.element.remove) {
                connection.element.remove();
            }
            if (connection.labelElement && connection.labelElement.remove) {
                connection.labelElement.remove();
            }
            if (connection.labelBackgroundElement && connection.labelBackgroundElement.remove) {
                connection.labelBackgroundElement.remove();
            }

            var path = '';
            path += 'M ' + fromConnectingPoint.attrs.cx + ',' + fromConnectingPoint.attrs.cy + ' ';
            path += ' L ' + toConnectingPoint.attrs.cx + ',' + toConnectingPoint.attrs.cy + ' ';

            var connector;
            if (animate) {
                connector = drawpath(_instance.instancePaper, path, lineDrawAnimSpeed, {}, function () {
                    connector.attr({
                        'arrow-end': 'classic-wide-long'
                    });
                });
            } else {
                connector = _instance.instancePaper.path(path);
                connector.attr({
                    'arrow-end': 'classic-wide-long'
                });
            }

            var fromComponent = _instance.entityStore.getComponent(connection.fromComponentId);
            var stencilConfig = _instance.entityStore.getStencilConfig(fromComponent.stencilId);
            var connectorConfigs = _instance.entityStore.getStencilConfig(stencilConfig.id).outboundConnectorConfigs;
            var currentConfig;

            for (var i = 0; i < connectorConfigs.length; i++) {
                if (connection.connectionType === connectorConfigs[i].type) {
                    currentConfig = connectorConfigs[i];
                    break;
                }
            }

            connector.attr({
                'stroke-width': 1.6,
                stroke: currentConfig.color ? currentConfig.color : '#A9A8B2',
                cursor: 'pointer'
            });

            var label = connection.label ? connection.label : currentConfig.defaultLabel ? currentConfig.defaultLabel : null;

            if (label) {
                var labelLength = label.length * 5.5;

                connection.labelElement = _instance.instancePaper.text(((fromConnectingPoint.attrs.cx + toConnectingPoint.attrs.cx) / 2) - (labelLength / 2) + 2, ((fromConnectingPoint.attrs.cy + toConnectingPoint.attrs.cy) / 2), label).attr({
                    'fill': currentConfig.color ? currentConfig.color : '#888',
                    'font-size': 10,
                    'text-anchor': 'start',
                    'font-family': 'Roboto-Regular',
                    cursor: 'pointer'
                });

                connection.labelBackgroundElement = _instance.instancePaper.rect(((fromConnectingPoint.attrs.cx + toConnectingPoint.attrs.cx) / 2) - (labelLength / 2) - 1, ((fromConnectingPoint.attrs.cy + toConnectingPoint.attrs.cy) / 2) - 5, labelLength, 10).attr({
                    'fill': '#F9F9F9',
                    opacity: 0.9,
                    stroke: 'none',
                    cursor: 'pointer'
                });

                connection.labelElement.toFront();

                connection.labelElement.mouseup(function (e) {
                    selectSingleItem(connection);
                    _instance.eventAPI.getFunction(_instance.eventAPI.EVT_CON_CLICK)(connection);
                    if (e.which === 3) {
                        showConnectionActionsMenu(connection, e);
                    }
                });

                connection.labelBackgroundElement.mouseup(function (e) {
                    selectSingleItem(connection);
                    _instance.eventAPI.getFunction(_instance.eventAPI.EVT_CON_CLICK)(connection);
                    if (e.which === 3) {
                        showConnectionActionsMenu(connection, e);
                    }
                });

                if (animate) {
                    connection.labelBackgroundElement.attr({
                        opacity: 0
                    });
                    var titleAnim = Raphael.animation({
                        opacity: 0.9
                    }, 0);
                    connection.labelBackgroundElement.animate(titleAnim.delay(lineDrawAnimSpeed / 2));
                    connection.labelElement.attr({
                        opacity: 0
                    });
                    var titleAnim = Raphael.animation({
                        opacity: 1
                    }, 0);
                    connection.labelElement.animate(titleAnim.delay(lineDrawAnimSpeed / 2));
                }
            }

            connection.element = connector;

            connector.mouseup(function (e) {
                selectSingleItem(connection);
                _instance.eventAPI.getFunction(_instance.eventAPI.EVT_CON_CLICK)(connection);
                if (e.which === 3) {
                    showConnectionActionsMenu(connection, e);
                }
            });

            return connector;
        }

        function drawConnectors(component, animate) {
            for (var i = 0; i < component.inboundConnections.length; i++) {
                drawConnector(component.inboundConnections[i], animate);
            }
            for (var i = 0; i < component.outboundConnections.length; i++) {
                drawConnector(component.outboundConnections[i], animate);
            }
        }

        function drawComponentMovement(component, displacement, undo) {
            var pos = {};
            if (undo) {
                pos = {
                    x: displacement.startingX,
                    y: displacement.startingY
                };
            } else {
                pos = {
                    x: displacement.endingX,
                    y: displacement.endingY
                };
            }
            component.element.attr(pos);
            drawComponentLabel(component, component.element[0]);
            return pos;
        }

        init();

        var instance = {
            deselectAll: function () {
                deselectAll();
            },
            drawComponent: function (component) {
                return drawComponent(component);
            },
            eraseComponent: function (component) {
                component.labelElement.remove();
                component.element['0'].connectingPoints.set.remove();
                component.element.remove();
            },
            drawComponentMovement: function (component, displacement, undo) {
                return drawComponentMovement(component, displacement, undo);
            },
            drawConnector: function (connection, animate) {
                return drawConnector(connection, animate);
            },
            drawConnectors: function (component, animate) {
                return drawConnectors(component, animate);
            },
            eraseConnector: function (connection) {
                deselectAll();
                connection.element.remove();
                if (connection.labelElement) {
                    connection.labelElement.remove();
                    connection.labelBackgroundElement.remove();
                }
            },
            addIndicator: function (component, indicatorName) {
                addIndicator(component, indicatorName);
            },
            removeIndicator: function (component, indicatorName) {
                removeIndicator(component, indicatorName);
            },
            removeIndicators: function (component) {
                removeIndicators(component);
            },
            clearAllIndicators: function () {
                clearAllIndicators();
            },
            toggleIndicator: function (component, indicatorName) {
                toggleIndicator(component, indicatorName);
            },
            deleteSelection: function () {
                deleteSelection();
            },
            blockUI: function () {
                blockUI();
            },
            unblockUI: function () {
                unblockUI();
            },
            drawComponentLabel: function (component) {
                drawComponentLabel(component, component.element[0]);
            },
            getMenu: function (editorMode) {
                if (editorMode) {
                    return $.extend(true, [], _instance.editModeMenuItems);
                } else {
                    return $.extend(true, [], _instance.observerModeMenuItems);
                }
            },
            setMenu: function (editorMode, menuConfig) {
                if (editorMode) {
                    _instance.editModeMenuItems = menuConfig;
                } else {
                    _instance.observerModeMenuItems = menuConfig;
                }
                createMenubar(menubarContainer);
            },
            addMenuItem: function (editorMode, menuItemConfig) {
                if (editorMode) {
                    _instance.editModeMenuItems.push(menuItemConfig);
                } else {
                    _instance.observerModeMenuItems.push(menuItemConfig);
                }
                createMenubar(menubarContainer);
            },
            showGrid: function (lineWidth) {
                showGrid(lineWidth);
            },
            hideGrid: function () {
                hideGrid();
            }
        };

        return instance;
    };
})(Metatron);

(function (Metatron) {
    Metatron.Util = function (_instance) {
        return {
            isWithinEl: function (baseEl, checkingEl) {
                var baseElBox = baseEl.getABox();
                var checkingElBox = checkingEl.getABox();
                return checkingElBox.topLeft.x > baseElBox.topLeft.x && checkingElBox.topRight.x < baseElBox.topRight.x && checkingElBox.topLeft.y > baseElBox.topLeft.y && checkingElBox.bottomLeft.y < baseElBox.bottomLeft.y;
            },
            checkColision: function (baseEl, checkingEl) {
                var baseElBox = baseEl.getABox();
                var checkingElBox = checkingEl.getABox();
                return !(baseElBox.left.x >= checkingElBox.right.x || baseElBox.right.x <= checkingElBox.left.x || baseElBox.top.y >= checkingElBox.bottom.y || baseElBox.bottom.y <= checkingElBox.top.y);
            },
            createComponent: function (stencilConfig, x, y) {
                return {
                    stencilId: stencilConfig.id,
                    displayName: stencilConfig.name,
                    indicators: [],
                    inboundConnections: [],
                    outboundConnections: [],
                    position: {
                        x: x,
                        y: y
                    }
                };
            },
            createConnection: function (fromComponentId, fromPlacement, toComponentId, toPlacement) {
                var connection = {
                    fromComponentId: fromComponentId,
                    fromPlacement: fromPlacement,
                    toComponentId: toComponentId,
                    toPlacement: toPlacement
                };
                var fromComponent = _instance.entityStore.getComponent(connection.fromComponentId);
                var stencilConfig = _instance.entityStore.getStencilConfig(fromComponent.stencilId);
                var connectorConfigs = _instance.entityStore.getStencilConfig(stencilConfig.id).outboundConnectorConfigs;
                var existingConnections = {};
                for (var i = 0; i < fromComponent.outboundConnections.length; i++) {
                    if (!existingConnections[fromComponent.outboundConnections[i].connectionType]) {
                        existingConnections[fromComponent.outboundConnections[i].connectionType] = 0;
                    }
                    existingConnections[fromComponent.outboundConnections[i].connectionType]++;
                }
                for (var i = 0; i < connectorConfigs.length; i++) {
                    if (!existingConnections[connectorConfigs[i].type] || existingConnections[connectorConfigs[i].type] < connectorConfigs[i].maxCount) {
                        connection.connectionType = connectorConfigs[i].type;
                        break;
                    }
                }

                return connection;
            },
            alignCoordinateToGrid: function (coordinate) {
                return Math.round(coordinate / _instance.gridSpacing) * _instance.gridSpacing;
            }
        };
    }
})(Metatron);

Raphael.el.is = function (type) {
    return this.type === ('' + type).toLowerCase();
};
Raphael.el.x = function () {
    return this.is('circle') ? this.attr('cx') : this.attr('x');
};
Raphael.el.y = function () {
    return this.is('circle') ? this.attr('cy') : this.attr('y');
};
Raphael.el.o = function () {
    this.ox = this.x();
    this.oy = this.y();
    return this;
};

Raphael.el.getABox = function () {
    var b = this.getBBox();

    var o = {
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        xLeft: b.x,
        xCenter: b.x + b.width / 2,
        xRight: b.x + b.width,
        yTop: b.y,
        yMiddle: b.y + b.height / 2,
        yBottom: b.y + b.height
    };

    o.center = {
        x: o.xCenter,
        y: o.yMiddle
    };

    o.topLeft = {
        x: o.xLeft,
        y: o.yTop
    };
    o.topRight = {
        x: o.xRight,
        y: o.yTop
    };
    o.bottomLeft = {
        x: o.xLeft,
        y: o.yBottom
    };
    o.bottomRight = {
        x: o.xRight,
        y: o.yBottom
    };

    o.top = {
        x: o.xCenter,
        y: o.yTop
    };
    o.bottom = {
        x: o.xCenter,
        y: o.yBottom
    };
    o.left = {
        x: o.xLeft,
        y: o.yMiddle
    };
    o.right = {
        x: o.xRight,
        y: o.yMiddle
    };

    o.offset = $(this.paper.canvas).parent().offset();

    return o;
};

Raphael.el.style = function (state, style, aniOptions) {
    if (!this.class) {
        this.class = style ? style : 'default';
        this.aniOptions = aniOptions ? aniOptions : null;

        this.mouseover(function () {
            this.style('hover');
        });
        this.mouseout(function () {
            this.style('base');
        });
        this.mousedown(function () {
            this.style('mousedown');
        });
        this.mouseup(function () {
            this.style('hover');
        });
    }

    style = this.class ? this.class : style;
    state = state ? state : 'base';
    aniOptions = this.aniOptions ? this.aniOptions : null;

    if (aniOptions) {
        this.animate(
            Raphael.styles[this.type][style][state],
            aniOptions.duration,
            aniOptions.easing
            //            , function () {
            //                if (aniOptions.callback) {
            //                    aniOptions.callback()
            //                }
            //                // do it again without the animation, to apply attributes that can't be animated, such as cursor, etc.
            //                this.attr(Raphael.styles[this.type][style][state]);
            //            }
        );
    } else {
        this.attr(Raphael.styles[this.type][style][state]);
    }

    return this;
};

Raphael.st.style = function (state, style, animated) {
    for (var i = 0, j = this.items.length; i < j; i++) {
        var item = this.items[i];
        item.style(state, style, animated);
    }

    return this;
};

Raphael.st.remove = function () {
    for (var i = 0, j = this.items.length; i < j; i++) {
        var item = this.items[i];
        item.remove();
    }
};

Raphael.setStyles = function (styles) {
    Raphael.styles = $.extend(true, {}, styles);
};

Raphael.setStyles({
    circle: {
        'connectorDots': {
            'base': {
                r: 5,
                fill: '#fff',
                stroke: '#666',
                'stroke-width': 1,
                opacity: 0
            },
            'show': {
                opacity: 0.4
            },
            'over': {
                'cursor': 'move',
                r: 14,
                fill: '#ddd',
                opacity: 1
            },
            'hover': {
                'cursor': 'move'
            },
            'connecting': {
                r: 7,
                fill: '#ffff00',
                opacity: 0.4
            }
        }
    }
});

Raphael.el.tooltip = function (tp, parentContainer, viewBoxState) {
    this.tp = tp;
    this.currentlyAdjustedVBX = 0;
    this.currentlyAdjustedVBY = 0;
    this.tp.ox = parentContainer.offset().left + 14;
    this.tp.oy = parentContainer.offset().top + 14;
    this.tp.hide();
    this.hover(
        function (event) {
            this.mousemove(function (event) {

                if (this.currentlyAdjustedVBX !== viewBoxState.x || this.currentlyAdjustedVBY !== viewBoxState.y) {
                    this.tp.translate(event.clientX - this.tp.ox - this.currentlyAdjustedVBX + viewBoxState.x, event.clientY - this.tp.oy - this.currentlyAdjustedVBY + viewBoxState.y);
                    this.currentlyAdjustedVBX = viewBoxState.x;
                    this.currentlyAdjustedVBY = viewBoxState.y;

                } else {
                    this.tp.translate(event.clientX - this.tp.ox, event.clientY - this.tp.oy);
                }

                this.tp.ox = event.clientX;
                this.tp.oy = event.clientY;
            });
            this.tp.show().toFront();
        },
        function (event) {
            this.tp.hide();
            this.unmousemove();
        }
    );
    return this;
};