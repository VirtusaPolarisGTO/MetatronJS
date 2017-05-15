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
