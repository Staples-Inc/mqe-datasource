import _ from 'lodash';
import * as dateMath from 'app/core/utils/datemath';
import MQEQuery from './query_builder';
import * as response_handler from './response_handler';

export class MQEDatasource {

  constructor(instanceSettings, $q, backendSrv, templateSrv) {
    this.type = instanceSettings.type;
    this.url = instanceSettings.url;
    this.name = instanceSettings.name;
    this.$q = $q;
    this.backendSrv = backendSrv;
    this.templateSrv = templateSrv;
    // this.templateSrv.formatValue = formatMQEValue;
  }

  // Called once per panel (graph)
  query(options) {
    var timeFrom = Math.ceil(dateMath.parse(options.range.from));
    var timeTo = Math.ceil(dateMath.parse(options.range.to));
    var mqeQuery,
        mqeQueryPromise;
    var self = this;

    var queries = _.map(options.targets, target => {
      if (target.hide || (target.rawQuery && !target.query)) {
        return [];
      } else {
        if (target.rawQuery) {
          // Use raw query
          mqeQuery = MQEQuery.addTimeRange(target.query, timeFrom, timeTo);

          // Return query in async manner
          mqeQueryPromise = this.$q.when([mqeQuery]);
        } else {

          // Build query
          var queryModel = new MQEQuery(target, this.templateSrv, options.scopedVars);
          mqeQueryPromise = this._mqe_explore().then(result => {
            return result.metrics;
          }).then(metrics => {
            return queryModel.render(metrics, timeFrom, timeTo, options.interval);
          });
        }

        return mqeQueryPromise.then(mqeQueries => {
          var queryPromises = _.map(mqeQueries, mqeQuery => {
            mqeQuery = self.templateSrv.replace(mqeQuery);
            return self._mqe_query(mqeQuery).then(response => {
              return response_handler.handle_response(target, response);
            });
          });
          return self.$q.all(queryPromises);
        });
      }
    });
    return this.$q.all(_.flatten(queries)).then(result => {
      return {
        data: _.flatten(result)
      };
    });
  }

  // Required
  // Used for testing datasource in datasource configuration pange
  testDatasource() {
    return this.backendSrv.datasourceRequest({
      url: this.url + '/',
      method: 'GET'
    }).then(response => {
      if (response.status === 200) {
        return {
          status: "success",
          message: "Connected to MQE",
          title: "Success"
        };
      }
    });
  }

  metricFindQuery(query) {
    if (!query) {
      return this.$q.when([]);
    }

    query = this.templateSrv.replace(query);
    return this._mqe_explore().then(result => {
      return _.map(result[query], metric => {
        return {
          text: metric,
          value: metric
        };
      });
    });
  }

  // Invoke GET request to /token endpoint and returns list of metrics.
  // For Staples only.
  _mqe_explore() {
    return this.backendSrv.datasourceRequest({
      url: this.url + '/token/',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => {
      return response.data.body;
    });
  }

  _mqe_query(query) {
    var mqe_query = {
      query: query
    };
    return this.backendSrv.datasourceRequest({
      url: this.url + '/query/',
      data: mqe_query,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => {
      return response.data;
    });
  }

}

// Special value formatter for MQE.
// Render multi-value variables for using in "IN" expression:
// $host => ('backend01', 'backend02')
// WHERE host IN $host => WHERE host IN ('backend01', 'backend02')
function formatMQEValue(value, format, variable) {
  if (typeof value === 'string') {
    return value;
  }
  return '(' + value.join(', ') + ')';
}
