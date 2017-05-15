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
