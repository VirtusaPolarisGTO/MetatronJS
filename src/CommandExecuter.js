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
