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
              // Use !== false for backward compatibility
              if (key === 'app' && target.addAppToAlias !== false || key === 'host' && target.addHostToAlias !== false) {
                return value;
              } else {
                return '';
              }
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

      function handle_explore_response(query, response) {

        function getTagset(response) {
          var tags = {};
          _.forEach(response.body['tagset'], function (tagset) {
            _.forEach(tagset, function (tagValue, tag) {
              if (!tags[tag]) {
                tags[tag] = [];
              }
              tags[tag].push(tagValue);
            });
          });
          _.forEach(tags, function (tagValue, tag) {
            tags[tag] = _.uniq(_.flatten(tagValue));
          });
          return tags;
        }

        if (query === 'tagset') {
          return getTagset(response);
        } else if (query === 'apps') {
          return getTagset(response)['App'];
        } else if (query === 'hosts') {
          return getTagset(response)['Hosts'];
        } else {
          return response.body[query];
        }
      }

      _export('handle_explore_response', handle_explore_response);
    }
  };
});
//# sourceMappingURL=response_handler.js.map
