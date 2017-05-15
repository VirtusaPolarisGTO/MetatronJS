var pathPrefix = 'images/accello/metatron/';

var indicators = [
    {
        displayName: 'Waiting',
        iconPath: pathPrefix + 'indicator/indicator-waiting.svg',
        name: 'WAITING',
        blink: true
    },
    {
        displayName: 'Started',
        iconPath: pathPrefix + 'indicator/indicator-started.svg',
        name: 'STARTED',
        blink: true
    },
    {
        displayName: 'Success',
        iconPath: pathPrefix + 'indicator/indicator-success.svg',
        name: 'SUCCESS',
        blink: false
    },
    {
        displayName: 'Reverted',
        iconPath: pathPrefix + 'indicator/indicator-reverted.svg',
        name: 'REVERTED',
        blink: false
    },
    {
        displayName: 'Error',
        iconPath: pathPrefix + 'indicator/indicator-error.svg',
        name: 'ERROR',
        blink: false
    },
    {
        displayName: 'Stopped',
        iconPath: pathPrefix + 'indicator/indicator-stopped.svg',
        name: 'STOPPED',
        blink: false
    }
];

var componentActions = [{
    displayName: 'Edit',
    executerFunction: function (component) {
        alert('Editting Task!');
    }
}];

var MET_STENCIL_BOX_CONFIG = {
    stencils: [
        {
            id: 'StartTask',
            name: 'Start',
            imgPath: pathPrefix + 'start.svg',
            actions: [],
            componentLimit: 1,
            nonRemovable: true,
            hidden: true,
            inboundConnectorConfigs: {
                minCount: 0,
                maxCount: 0
            },
            outboundConnectorConfigs: [
                {
                    type: 'success',
                    minCount: 1,
                    maxCount: 1,
                }
            ],
            indicators: []
        },
        {
            id: 'FunctionTask',
            name: 'Business Function',
            imgPath: pathPrefix + 'business-function.svg',
            actions: componentActions,
            inboundConnectorConfigs: {
                minCount: 1,
                maxCount: 1
            },
            outboundConnectorConfigs: [
                {
                    type: 'success',
                    minCount: 1,
                    maxCount: 1,
                },
                {
                    type: 'fail',
                    minCount: 1,
                    maxCount: 1,
                    color: '#EA8988',
                    defaultLabel: 'Fail'
                }
            ],
            indicators: indicators
        },
        {
            id: 'UserTask',
            name: 'User Task',
            imgPath: pathPrefix + 'user-task.svg',
            actions: componentActions,
            inboundConnectorConfigs: {
                minCount: 1,
                maxCount: 1
            },
            outboundConnectorConfigs: [
                {
                    type: 'success',
                    minCount: 1,
                    maxCount: 1,
                },
                {
                    type: 'fail',
                    minCount: 1,
                    maxCount: 1,
                    color: '#EA8988',
                    defaultLabel: 'Fail'
                }
            ],
            indicators: indicators
        },
        {
            id: 'TriggerTask',
            name: 'Trigger',
            imgPath: pathPrefix + 'trigger.svg',
            actions: componentActions,
            inboundConnectorConfigs: {
                minCount: 1,
                maxCount: 1
            },
            outboundConnectorConfigs: [
                {
                    type: 'trigger',
                    minCount: 1,
                    maxCount: 1,
                    defaultLabel: 'Trigger'
                },
                {
                    type: 'success',
                    minCount: 1,
                    maxCount: 1,
                    defaultLabel: 'Completed'
                },
                {
                    type: 'fail',
                    minCount: 1,
                    maxCount: 1,
                    color: '#EA8988',
                    defaultLabel: 'Fail'
                }
            ],
            indicators: indicators
        },
        {
            id: 'WorkflowTask',
            name: 'WorkFlow',
            imgPath: pathPrefix + 'workflow.svg',
            actions: componentActions,
            inboundConnectorConfigs: {
                minCount: 1,
                maxCount: 1
            },
            outboundConnectorConfigs: [
                {
                    type: 'success',
                    minCount: 1,
                    maxCount: 1,
                },
                {
                    type: 'fail',
                    minCount: 1,
                    maxCount: 1,
                    color: '#EA8988',
                    defaultLabel: 'Fail'
                }
            ],
            indicators: indicators
        },
        {
            id: 'custom_task',
            name: 'Custom Task',
            imgPath: pathPrefix + 'custom-task.svg',
            actions: componentActions,
            inboundConnectorConfigs: {
                minCount: 1,
                maxCount: 1
            },
            outboundConnectorConfigs: [
                {
                    type: 'success',
                    minCount: 1,
                    maxCount: 1,
                },
                {
                    type: 'fail',
                    minCount: 1,
                    maxCount: 1,
                    color: '#EA8988',
                    defaultLabel: 'Fail'
                }
            ],
            indicators: indicators
        },
        {
            id: 'IfTask',
            name: 'If',
            imgPath: pathPrefix + 'if.svg',
            actions: componentActions,
            inboundConnectorConfigs: {
                minCount: 1,
                maxCount: 1
            },
            outboundConnectorConfigs: [
                {
                    type: 'yes',
                    minCount: 1,
                    maxCount: 1,
                    defaultLabel: 'Yes'
                },
                {
                    type: 'no',
                    minCount: 1,
                    maxCount: 1,
                    defaultLabel: 'No'
                }
            ],
            indicators: indicators
        },
        {
            id: 'AllTask',
            name: 'All',
            imgPath: pathPrefix + 'all.svg',
            actions: componentActions,
            inboundConnectorConfigs: {
                minCount: 1,
                maxCount: 7
            },
            outboundConnectorConfigs: [
                {
                    type: 'success',
                    minCount: 1,
                    maxCount: 1
                }
            ],
            indicators: indicators
        },
        {
            id: 'AnyTask',
            name: 'Any',
            imgPath: pathPrefix + 'any.svg',
            actions: componentActions,
            inboundConnectorConfigs: {
                minCount: 1,
                maxCount: 7
            },
            outboundConnectorConfigs: [
                {
                    type: 'success',
                    minCount: 1,
                    maxCount: 1
                }
            ],
            indicators: indicators
        },
        {
            id: 'SplitTask',
            name: 'Split',
            imgPath: pathPrefix + 'split.svg',
            actions: componentActions,
            inboundConnectorConfigs: {
                minCount: 1,
                maxCount: 1
            },
            outboundConnectorConfigs: [
                {
                    type: 'success',
                    minCount: 1,
                    maxCount: 7
                }
            ],
            indicators: indicators
        },
        {
            id: 'EndTask',
            name: 'End',
            imgPath: pathPrefix + 'end.svg',
            actions: [],
            componentLimit: 1,
            nonRemovable: true,
            hidden: true,
            inboundConnectorConfigs: {
                minCount: 1,
                maxCount: 1
            },
            outboundConnectorConfigs: [
                {
                    type: 'success',
                    minCount: 0,
                    maxCount: 0,
                }
            ],
            indicators: []
        },
    ]
};