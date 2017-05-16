var mxGraph = {
  props: {
    id: String,
    props: Object,
  },
  data: function() {
    return {
      el: {},
      rows: {},
      util: {
        axes: {
          x: {},
          y: {},
        },
        sequences: {
          label: {}
        }
      },
    }
  },
  methods: {
    drawUser: function() {
      this.drawPath(this.el.user, this.rows.user);
    },
    drawOrig: function() {
      this.drawPath(this.el.orig, this.rows.orig)
    },
    drawPath: function(el, points) {
      // https://github.com/d3/d3-selection/blob/master/README.md#selection_data
      // General Update Pattern
      // select → data → exit → remove → enter → append → merge
      var self = this;

      // find segments
      var segments = [];
      var currentSegment = [];
      for(var point of points) {
        if(point.show === 'no') {
          if(currentSegment.length > 0)
            segments.push(currentSegment);
          currentSegment = [];
        }
        else {
          currentSegment.push(point);
        }
      }
      if(currentSegment.length > 0)
        segments.push(currentSegment);

      // draw path
      var paths = el.selectAll('path').data(segments);
      paths.exit().remove();
      paths.enter().append('path').merge(paths).attr('d', this.util.line);

      // draw circles
      var circles = el.selectAll('circle').data(points, function(d) { return d.x; });
      circles.exit().remove();
      circles.enter().append('circle').merge(circles)
        .attr('r', this.props.size.r)
        .attr('cx', function(d) { return self.util.axes.x.scale(d.x); })
        .attr('cy', function(d) { return self.util.axes.y.scale(d.y); })
        .classed('fix', function(d) {return d.show === 'yes' })
        .classed('hide', function(d) { return d.show === 'no' });

      var labels = el.selectAll('text').data(points, function(d) { return d.x; });
      labels.exit().remove();
      labels.enter().append('text').merge(labels)
        .text(function(d) { return self.util.sequences.label.format(d.y); })
        .attr('x', function(d) { return self.util.axes.x.scale(d.x); })
        .attr('y', function(d) { return self.util.axes.y.scale(d.y) - self.props.size.r*1.5; })
        .classed('hide', function(d) { return d.show === 'no' });
    },
    draw: function() {
      var self = this;
      var props = this.props;
      var util = this.util;
      var rows = this.rows;

      // calculate padding
      props.size.p = props.size.r*8;

      // make graph
      this.el.root = d3.select(this.$el).select('.draw')
        .append('svg')
        .attr('width', props.size.w)
        .attr('height', props.size.h);

      // x & y scale
      var xValues = rows.user.map(function(d) { return d.x; });
      util.axes.x.scale = d3.scalePoint()
        .domain(xValues)
        .range([0 + props.size.p, props.size.w - props.size.p]);
      util.axes.y.scale = d3.scaleLinear()
        .domain([props.axes.y.min, props.axes.y.max])
        .range([props.size.h - props.size.p, 0 + props.size.p]);

      // function for generating path between points
      util.line = d3.line()
        .x(function(d) { return util.axes.x.scale(d.x); })
        .y(function(d) { return util.axes.y.scale(d.y); });

      // draw circles & path through circles
      this.el.user = this.el.root.append('g').attr('id', 'user');
      this.el.orig = this.el.root.append('g').attr('id', 'orig');

      // draw x axis
      util.axes.x.axis = d3.axisTop(util.axes.x.scale)
        .tickFormat(function(d) {
          return d + (this.parentNode.nextSibling ? '' : props.axes.x.label); // add unit at last tick
        });
      this.el.root.append('g')
        .attr('id', 'axis-x')
        .attr('transform', 'translate(' + [0, props.size.h - 2].join(',') + ')')
        .call(util.axes.x.axis);

      // draw y axis
      util.axes.y.format = function(d) {
        return d3.format(props.axes.y.formatString)(d/props.axes.y.divider);
      };
      util.axes.y.axis = d3.axisRight(util.axes.y.scale)
        .tickFormat(function(d) {
          // format + unit at last tick
          return util.axes.y.format(d) + (this.parentNode.nextSibling ? '' : props.axes.y.label);
        });
      this.el.root.append('g')
        .attr('id', 'axis-y')
        .call(util.axes.y.axis);

      // add button to finish and show comparison
      this.$button = d3.select(this.$el).append('button')
        .text('畫好了啦')
        .on('click', function() {
          self.drawOrig();
          self.el.root.on('mousedown', null);
          self.el.root.on('mousedown.drag', null);
        });

      // make callback to redraw at user input
      function redraw() {
        // get input position
        var m = d3.mouse(this);
        var x = m[0];
        var y = Math.max(props.size.p, Math.min(m[1], props.size.h - props.size.p));

        // find point to modify
        for(var target = 0; x > util.axes.x.scale.range()[0] + util.axes.x.scale.step()*(target + 0.5); target++);
        if(target < rows.user.length && rows.user[target].show === 'no') {
          rows.user[target].y = util.axes.y.scale.invert(y);
          rows.user[target].show = 'yes';
          self.drawUser();
        }
      }

      // execute callback on click/touch/drag
      self.el.root.on('mousedown', redraw);
      self.el.root.call(d3.drag().on('drag', redraw));

      util.sequences.label.format = function(d) {
        return d3.format(props.sequences[0].label.formatString)(d/props.axes.y.divider);
      };

      // draw
      this.drawUser();
    }
  }
}
