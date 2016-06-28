var fs = require('fs');
var d3 = require('d3');
var jsdom = require('jsdom');
var exec = require('child_process').exec;

module.exports = function(results) {
    'use strict';

    var frequency = {};
    var total = 0;

    results.forEach(function(file) {
        file.messages.forEach(function(err) {
            var rule = err.ruleId;
            if (frequency[rule]) {
                frequency[rule] = frequency[rule] + 1;
            } else {
                frequency[rule] = 1;
            }
            total++;
        });
    });

    var data = [];

    Object.keys(frequency).forEach(function(error) {
        if (1.0 * frequency[error] / total > 0.01) {
            data.push({
                error: error,
                count: frequency[error],
                frequency: 1.0 * frequency[error] / total
            });
        }
    });

    jsdom.env({
        html: '',
        features: {QuerySelector: true},
        done: function(errors, window) {
            var margin = {top: 20, right: 20, bottom: 200, left: 40},
                width = 960 - margin.left - margin.right,
                height = 500 - margin.top - margin.bottom;

            var formatPercent = d3.format('.0%');

            var x = d3.scale.ordinal()
                .rangeRoundBands([0, width], 0.1, 1);

            var y = d3.scale.linear()
                .range([height, 0]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient('bottom');

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient('left')
                .tickFormat(formatPercent);

            var svg = d3.select(window.document.body).append('svg')
                .attr('xmlns', 'http://www.w3.org/2000/svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .append('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            data.forEach(function(d) {
                d.frequency = +d.frequency;
            });

            x.domain(data.map(function(d) { return d.error; }));
            y.domain([0, d3.max(data, function(d) { return d.frequency; })]);

            svg.append('g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(0,' + height + ')')
                .call(xAxis)
                .selectAll('text')
                .attr('x', -13)
                .attr('transform', 'rotate(-45)')
                .style('text-anchor', 'end')
                .style('font-size', '16px')
                .style('font-family', 'Helvetica, sans-serif');

            svg.append('g')
                .attr('class', 'y axis')
                .call(yAxis)
                .append('text')
                .attr('transform', 'rotate(-90)')
                .attr('y', 6)
                .attr('x', -3)
                .attr('dy', '.71em')
                .style('text-anchor', 'end')
                .style('font-family', 'Helvetica, sans-serif')
                .text('Frequency');

            svg.selectAll('.bar')
                .data(data)
                .enter()
                .append('rect')
                .attr('class', 'bar')
                .attr('x', function(d) { return x(d.error); })
                .attr('width', x.rangeBand())
                .attr('y', function(d) { return y(d.frequency); })
                .attr('height', function(d) { return height - y(d.frequency); })

            fs.writeFile('/tmp/eslintresults.svg', d3.select(window.document.body).html(), function() {
                exec('open -a "Google Chrome" file:///tmp/eslintresults.svg');
            });
        }
    });
};
