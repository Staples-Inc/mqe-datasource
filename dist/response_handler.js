'use strict';

System.register(['lodash'], function (_export, _context) {
  "use strict";

  var _;

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }],
    execute: function () {
      function handle_response(target, response) {
        var timeseries = _.map(response.body, function (body) {
          return _.map(body.series, function (series) {
            var timerange = body.timerange;
            var datapoints = _.map(series.values, function (value, index) {
              return [Number(value), // value
              Number(timerange.start + timerange.resolution * index) // timestamp
              ];
            });

            var metric_prefix = _.map(series.tagset, function (value, key) {
              return value;
            }).join(' ');

            return {
              target: metric_prefix + ' ' + body.name,
              datapoints: datapoints
            };
          });
        });
        return _.flatten(timeseries, true);
      }

      _export('handle_response', handle_response);
    }
  };
});
//# sourceMappingURL=response_handler.js.map
