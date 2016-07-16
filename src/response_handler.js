import _ from 'lodash';

export function handle_response(target, response) {
  var timeseries = _.map(response.body, (body) => {
    return _.map(body.series, (series) => {
      var timerange = body.timerange;
      var datapoints = _.map(series.values, (value, index) => {
        return [
          Number(value), // value
          Number(timerange.start + timerange.resolution * index)  // timestamp
        ];
      });

      var metric_prefix = _.map(series.tagset, (value, key) => {
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
