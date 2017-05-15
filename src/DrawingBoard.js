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

                var now = new Date().getTime();
                if (this.firstClick && this.firstClick + 400 > now) {
                    _instance.eventAPI.getFunction(_instance.eventAPI.EVT_CMP_DBL_CLICK)(component);
                    this.firstClick = undefined;
                } else {
                    _instance.eventAPI.getFunction(_instance.eventAPI.EVT_CMP_CLICK)(component);
                    this.firstClick = now;
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
