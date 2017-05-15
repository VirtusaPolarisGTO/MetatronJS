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
