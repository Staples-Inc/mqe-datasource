import _ from 'lodash';

export default class MQEQuery {

  /** @ngInject */
  constructor(target, templateSrv, scopedVars) {
    this.target = target;
    this.templateSrv = templateSrv;
    this.scopedVars = scopedVars;
  }

  /////////////////////
  // Query Rendering //
  /////////////////////

  render(metricList, timeFrom, timeTo, interval) {
    let target = this.target;
    let metrics = [];

    for (let m of target.metrics) {
      let metric = m.metric;
      if (metric) {
        if (containsWildcard(metric)) {
          let filteredMetrics = filterMetrics(metric, metricList);

          // Add alias
          if (m.alias) {
            if (containsWildcard(m.alias)) {
              // Set whildcard part as metric alias
              // query: os.cpu.* alias: * -> metric: os.cpu.system -> alias: system
              filteredMetrics = _.map(filteredMetrics, _.partial(getMetricSuffix, metric));
            } else {
              filteredMetrics = _.map(filteredMetrics, _.partial(addMQEAlias, m.alias));
            }
          }

          metrics = metrics.concat(filteredMetrics);
        } else {
          // Add alias
          if (m.alias) {
            metric = addMQEAlias(m.alias, metric);
          }

          metrics = metrics.concat(metric);
        }
      }
    }
    metrics = _.uniq(metrics);

    return _.map(metrics, metric => {
      let query = "";
      query += metric;

      // Render apps and hosts
      query += this.renderWhere(target.apps, target.hosts);

      query = MQEQuery.addTimeRange(query, timeFrom, timeTo);
      return query;
    });
  }

  renderWhere(apps, hosts) {
    let query = "";
    if (apps.length || hosts.length) {
      query += " where ";
      if (apps.length) {
        query += "app in (" + _.map(apps, app => {
          return "'" + app + "'";
        }).join(', ') + ")";
        if (hosts.length)  {
          query += " and ";
        }
      }
      if (hosts.length) {
        query += "host in (" + _.map(hosts, host => {
          return "'" + host + "'";
        }).join(', ') + ")";
      }
    }
    return query;
  }

  renderWhereClauses(whereClauses) {
    var renderedClauses = _.map(whereClauses, (clauseObj, index) => {
      var rendered = "";
      if (index !== 0) {
        rendered += clauseObj.condition + " ";
      }

      // Put non-numeric values into quotes.
      var value;
      if (_.isNumber(clauseObj.value) ||
          this.containsVariable(clauseObj.value)) {
        value = clauseObj.value;
      } else {
        value = "'" + clauseObj.value + "'";
      }
      rendered += clauseObj.column + ' ' + clauseObj.operator + ' ' + value;
      return rendered;
    });
    return renderedClauses.join(' ');
  }

  // Check for template variables
  containsVariable(str) {
    var variables = _.map(this.templateSrv.variables, 'name');
    var self = this;
    return _.some(variables, variable => {
      return self.templateSrv.containsVariable(str, variable);
    });
  }

  ////////////////////
  // Static methods //
  ////////////////////

  static getMetrics() {
    var query = "describe all";
    return query;
  }

  static getColumns(metric) {
    return "describe " + metric;
  }

  static addTimeRange(query, timeFrom, timeTo, interval) {
    var timeRangeRegex = /from.*to/;
    if(!timeRangeRegex.test(query)) {
      query = trim(query) + " from " + timeFrom + " to " + timeTo;
    }
    return query;
  }
}

function containsWildcard(str) {
  var wildcardRegex = /\*/;
  return wildcardRegex.test(str);
}

function filterMetrics(str, metrics) {
  str = str.replace(/\./g, '\\\.');
  var filterRegex = new RegExp(str.replace('*', '.*'), 'g');
  return _.filter(metrics, metric => {
    return metric.search(filterRegex) !== -1;
  });
}

function trim(str) {
  var trimRegex = /^[\s]*(.*?)[\s]*$/;
  var match = str.match(trimRegex);
  return match ? match[0] : match;
}

function getMetricSuffix(metricQuery, metric) {
  let metricPrefix = metricQuery.replace(/\./g, '\\\.');
  let suffixRegex = new RegExp(metricPrefix.replace('*', '(.*)'));
  let suffix = suffixRegex.exec(metric);
  return addMQEAlias(suffix[1], metric);
}

function addMQEAlias(alias, metric) {
  return metric + " {" + alias + "}";
}
