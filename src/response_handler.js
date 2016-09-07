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
        // Use !== false for backward compatibility
        if ((key === 'app' && target.addAppToAlias !== false) ||
            (key === 'host' && target.addHostToAlias !== false)) {
          return value;
        }
        else {
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

export function handle_explore_response(query, response) {

  function getTagset(response) {
    let tags = {};
    _.forEach(response.body['tagset'], (tagset) => {
      _.forEach(tagset, (tagValue, tag) => {
        if (!tags[tag]) {
          tags[tag] = [];
        }
        tags[tag].push(tagValue);
      });
    });
    _.forEach(tags, (tagValue, tag) => {
      tags[tag] = _.uniq(_.flatten(tagValue));
    });
    return tags;
  }

  if (query === 'tagset') {
    return getTagset(response);
  }
  else if (query === 'cluster') {
    return getTagset(response)['cluster'];
  }
  else if (query === 'hosts') {
    return getTagset(response)['hosts'];
  }
  else {
    return response.body[query];
  }
}
