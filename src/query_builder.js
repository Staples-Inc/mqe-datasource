import _ from 'lodash';

export default class MQEQuery {

  /** @ngInject */
  constructor(target, templateSrv, scopedVars) {
    this.target = target;
    this.templateSrv = templateSrv;
    // this.templateSrv.formatValue = formatMQEMetric;
    this.scopedVars = scopedVars;
  }

  /////////////////////
  // Query Rendering //
  /////////////////////

  render(metricList, timeFrom, timeTo) {
    let target = this.target;
    let metrics = [];
    if (target.metrics === undefined) {
      return;
    }

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
              filteredMetrics = _.map(filteredMetrics,
                _.partial(convertMetricWithWildcard, target.functionList, metric));
            } else if(containsIndex(m.alias)){
              // query: tag1.tag2.* (the  metric can be very lengthy like below)
              // metric: tag1.tag2.tag3.tag4.tag5.tag6
              // alias: $6 ie show only tag6
              var indices = getAliasIndexArray(m.alias);
              filteredMetrics = _.map(filteredMetrics, _.partial(convertMetricWithIndex, target.functionList, indices));
            }
            else {
              filteredMetrics = _.map(filteredMetrics,
                _.compose(_.partial(this.addFunctionsWithAlias, target.functionList, m.alias), wrapMetric));
            }
          } else {
            filteredMetrics = _.map(filteredMetrics, _.partial(this.addFunctionsToMetric, target.functionList));
          }

          metrics = metrics.concat(filteredMetrics);
        } else {
          var defaultAlias = metric;
          metric = addJoinsIfAny(m);
          metric = wrapMetric(metric);
          // add functions here for single metric without wildcard
          // Render functions if any
          if(target.functionList !== undefined) {
            if (target.functionList.length !== 0) {
              metric += addFunctions(target.functionList);
            }
          }
          // Add alias
          if (m.alias) {
            metric = addMQEAlias(m.alias, metric);
          }
          else {
            metric = addMQEAlias(defaultAlias, metric);
          }
          metrics = metrics.concat(metric);
        }
      }
    }
    metrics = _.uniq(metrics);

    return _.map(metrics, metric => {
      let query = "";

      // Set custom metric format function
      let formatValueOriginal = this.templateSrv.formatValue;
      this.templateSrv.formatValue = formatMQEMetric;
      metric = this.templateSrv.replace(metric, this.scopedVars);

      // Set original format function
      this.templateSrv.formatValue = formatValueOriginal;

      query += metric;

      // Render apps and hosts
      query += this.renderWhere(target.apps, target.hosts);

      query = MQEQuery.addTimeRange(query, timeFrom, timeTo);
      return query;
    });
  }

  addFunctionsWithAlias(functionList, alias, metric) {
    if(functionList !== undefined) {
      if (functionList.length !== 0) {
        metric += addFunctions(functionList);
      }
    }
    var resultmetric =  addMQEAlias(alias, metric);
    return resultmetric;
  }

  addFunctionsToMetric(functionList, metric) {
    let defaultAlias = metric;
    metric = wrapMetric(metric);
    if(functionList !== undefined) {
      if (functionList.length !== 0) {
        metric += addFunctions(functionList);
        return addMQEAlias(defaultAlias, metric);
      }
    }
    return metric;
  }

  renderWhere(apps, hosts) {
    let query = "";
    if (apps.length || hosts.length) {
      query += " where ";
      if (apps.length) {
        query += "cluster in (" + _.map(apps, wrapTag).join(', ') + ")";
        if (hosts.length)  {
          query += " and ";
        }
      }
      if (hosts.length) {
        query += "host in (" + _.map(hosts, wrapTag).join(', ') + ")";
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

  static addTimeRange(query, timeFrom, timeTo) {
    var timeRangeRegex = /from.*to/;
    if(!timeRangeRegex.test(query)) {
      query = trim(query) + " from " + timeFrom + " to " + timeTo;
    }
    return query;
  }
}

function containsWildcard(str) {
  var wildcardRegex = /[*!]/;
  return wildcardRegex.test(str);
}

function containsIndex(str) {
  var wildcardRegex = /\$(\d)/g;
  return wildcardRegex.test(str);
}

function getAliasIndexArray(str) {
  // replace all the $ with space
  // convert it to list
  str = str.replace(/\$/g, ' ');
  str = str.trim();
  var indices = str.split(' ');
  for(var i=0; i<indices.length; i++) {
    indices[i] = parseInt(indices[i], 10);
  }
  return indices;
}

function getMetricSplits(str) {
  var metricSplits = str.split('.');
  return (metricSplits);

}

function getEachMetricTagSplits(metricSplits) {
  var newMetricSplits = [];
  var metricSplitsLength = metricSplits.length;
  for(var i = 0; i<metricSplitsLength; i++) {
    var metricTag = metricSplits[i];
    if(metricTag.search(/!/) !== -1) {
      var metricTagCopy = metricTag;
      var startIndex = 0, endIndex =metricTag.length-1 ;
      var isRegexFound = false;
      for(var j= 0; j<metricTag.length; j++) {
        if(metricTag[j] === '!') {
          endIndex = j;
          if(startIndex !== endIndex){
            newMetricSplits.push(metricTagCopy.slice(startIndex, endIndex));
          }
          startIndex = j;
          isRegexFound = true;
        }
        else if(isRegexFound === true){
          if(metricTag[j] === '_') {
            endIndex = j+1;
            newMetricSplits.push(metricTagCopy.slice(startIndex, endIndex));
            startIndex = j+1;
            isRegexFound = false;
          }
        }
        if(j=== metricTag.length-1) {
          endIndex = metricTag.length;
          newMetricSplits.push(metricTagCopy.slice(startIndex, endIndex));
        }
      }
    }
    else {
      newMetricSplits.push(metricTag);
    }
  }
  return newMetricSplits;
}

function getCustomAliasName(metricSplits, indices) {
  var aliasString = "";
  for(var i = 0; i<indices.length; i++) {
    var index = indices[i]-1;
    if(index >= 0 && index <  metricSplits.length) {
      aliasString += metricSplits[indices[i] - 1] + ".";
    }
  }
  return aliasString.slice(0, -1);
}

function addFunctions(functions){
  var query = "";
  if (functions.length) {
    _.forEach(functions, function (fn) {
      if(fn.func.length !== 0) {
        query += "|" + fn.func + " ";
      }
    });
  }
  return query;
}

function convertMetricWithIndex(functionList, indices, metric) {
  var suffix = getCustomAliasName(getMetricSplits(metric),indices);
  metric = wrapMetric(metric);
  if(functionList !== undefined) {
    if (functionList.length !== 0) {
      metric += addFunctions(functionList);
    }
  }

  return addMQEAlias(suffix, metric);
}

function composeRegex(str){
  var regex="";
  var metricSplits = getMetricSplits(str);
  metricSplits = getEachMetricTagSplits(metricSplits);
  for(var i = 0; i<metricSplits.length; i++) {
    if(metricSplits[i].search(/!/g) !== -1) {
      str = metricSplits[i].replace(/!/g,"");
      regex += "^(?!.*"+str;
    }
    else if(metricSplits[i].search(/\*/g) !== -1) {
      str = metricSplits[i].replace(/\*/g,"");
      regex += "(?=.*"+str;
    }
    else {
      regex += "(?=.*"+metricSplits[i];
    }
    regex += (i === metricSplits.length-1) ? ")" : "\.)";
  }
  regex = new RegExp(regex);
  return regex;
}

function filterMetrics(str, metrics) {
  let filterRegex;
  var  containsFilter = str.search(/!/);

  if(containsFilter !== -1) {
    filterRegex = composeRegex(str);
  }
  else {
    str = str.replace(/\./g, '\\\.');
    filterRegex = new RegExp(str.replace('*', '.*'), 'g');
  }
  return _.filter(metrics, metric => {
    return metric.search(filterRegex) !== -1;
  });
}

function trim(str) {
  var trimRegex = /^[\s]*(.*?)[\s]*$/;
  var match = str.match(trimRegex);
  return match ? match[0] : match;
}

function convertMetricWithWildcard(functions, metricQuery, metric) {
  let suffix = getMetricSuffix(metricQuery, metric);
  metric = wrapMetric(metric);

  // Render functions if any  before add alias
  if(functions !== undefined) {
    if (functions.length !== 0) {
      metric += addFunctions(functions);
    }
  }
  return addMQEAlias(suffix, metric);
}

function getMetricSuffix(metricQuery, metric) {
  let metricPrefix = metricQuery.replace(/\./g, '\\\.');
  let suffixRegex = new RegExp(metricPrefix.replace('*', '(.*)'));
  let suffix = suffixRegex.exec(metric);
  return suffix[1];
}

function addMQEAlias(alias, metric) {
  return metric + " {" + alias + "}";
}

function addJoinsIfAny(metricDetail) {
  // check for joins in metricDetail
  // if exists, take metric and keep on adding each JoinOperator and JoinMetric to the metric, like
  // os.cpu.all.system` + `os.cpu.all.irq` - `os.cpu.guest etc
  // if no joins, do nothing just return
  let metric = metricDetail.metric;
  if(metricDetail.joins !== undefined) {
    if(metricDetail.joins.length !== 0) {
      for(var i = 0; i<metricDetail.joins.length; i++) {
        let currentJoinMetric = metricDetail.joins[i];
        let joinOP = currentJoinMetric.joinOP.trim();
        let joinMetric = currentJoinMetric.joinMetric.trim();

        if(joinOP.length !== 0 && joinMetric.length !== 0) {
          metric += "` " + currentJoinMetric.joinOP + " `" + currentJoinMetric.joinMetric;
        }
      }
    }
  }
  return metric;
}

// Wrap metric with ``: os.cpu.user -> `os.cpu.user`
function wrapMetric(metric) {
  return '(`' + metric + '`)';
}

function wrapTag(tag) {
  return "'" + tag + "'";
}

// Special value formatter for MQE metric.
// Render multi-value variables for using with metric template:
// $metric => ('os.cpu.user', 'os.cpu.system')
// select `$metric` => select `os.cpu.user`, `os.cpu.system`
function formatMQEMetric(value) {
  if (typeof value === 'string') {
    return value;
  }
  return value.join("`, `");
}
