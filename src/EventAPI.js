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
