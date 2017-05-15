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