"use strict";

System.register(["lodash"], function (_export, _context) {
  "use strict";

  var _, _createClass, MQEQuery;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function containsWildcard(str) {
    var wildcardRegex = /\*/;
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
    for (var i = 0; i < indices.length; i++) {
      indices[i] = parseInt(indices[i], 10);
    }
    return indices;
  }

  function getMetricSplits(str) {
    var metricSplits = str.split('.');
    return metricSplits;
  }

  function getCustomAliasName(metricSplits, indices) {
    var aliasString = "";
    for (var i = 0; i < indices.length; i++) {
      var index = indices[i] - 1;
      if (index >= 0 && index < metricSplits.length) {

        aliasString += metricSplits[indices[i] - 1] + ".";
      }
    }
    return aliasString.slice(0, -1);
  }

  function convertMetricWithIndex(indices, metric) {
    var suffix = getCustomAliasName(getMetricSplits(metric), indices);
    return addMQEAlias(suffix, wrapMetric(metric));
  }

  function filterMetrics(str, metrics) {
    str = str.replace(/\./g, '\\\.');
    var filterRegex = new RegExp(str.replace('*', '.*'), 'g');
    return _.filter(metrics, function (metric) {
      return metric.search(filterRegex) !== -1;
    });
  }

  function trim(str) {
    var trimRegex = /^[\s]*(.*?)[\s]*$/;
    var match = str.match(trimRegex);
    return match ? match[0] : match;
  }

  function convertMetricWithWildcard(metricQuery, metric) {
    var suffix = getMetricSuffix(metricQuery, metric);
    return addMQEAlias(suffix, wrapMetric(metric));
  }

  function getMetricSuffix(metricQuery, metric) {
    var metricPrefix = metricQuery.replace(/\./g, '\\\.');
    var suffixRegex = new RegExp(metricPrefix.replace('*', '(.*)'));
    var suffix = suffixRegex.exec(metric);
    return suffix[1];
  }

  function addMQEAlias(alias, metric) {
    return metric + " {" + alias + "}";
  }

  // Wrap metric with ``: os.cpu.user -> `os.cpu.user`
  function wrapMetric(metric) {
    return '`' + metric + '`';
  }

  function wrapTag(tag) {
    return "'" + tag + "'";
  }

  // Special value formatter for MQE metric.
  // Render multi-value variables for using with metric template:
  // $metric => ('os.cpu.user', 'os.cpu.system')
  // select `$metric` => select `os.cpu.user`, `os.cpu.system`
  function formatMQEMetric(value, format, variable) {
    if (typeof value === 'string') {
      return value;
    }
    return value.join("`, `");
  }
  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      MQEQuery = function () {

        /** @ngInject */
        function MQEQuery(target, templateSrv, scopedVars) {
          _classCallCheck(this, MQEQuery);

          this.target = target;
          this.templateSrv = templateSrv;
          // this.templateSrv.formatValue = formatMQEMetric;
          this.scopedVars = scopedVars;
        }

        /////////////////////
        // Query Rendering //
        /////////////////////

        _createClass(MQEQuery, [{
          key: "render",
          value: function render(metricList, timeFrom, timeTo, interval) {
            var _this = this;

            var target = this.target;
            var metrics = [];

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = target.metrics[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var m = _step.value;

                var metric = m.metric;
                if (metric) {
                  if (containsWildcard(metric)) {
                    var filteredMetrics = filterMetrics(metric, metricList);

                    // Add alias
                    if (m.alias) {
                      if (containsWildcard(m.alias)) {
                        // Set whildcard part as metric alias
                        // query: os.cpu.* alias: * -> metric: os.cpu.system -> alias: system
                        filteredMetrics = _.map(filteredMetrics, _.partial(convertMetricWithWildcard, metric));
                      } else if (containsIndex(m.alias)) {
                        // query: tag1.tag2.* (the  metric can be very lengthy like below)
                        // metric: tag1.tag2.tag3.tag4.tag5.tag6
                        // alias: $6 ie show only tag6
                        var indices = getAliasIndexArray(m.alias);
                        filteredMetrics = _.map(filteredMetrics, _.partial(convertMetricWithIndex, indices));
                      } else {
                        filteredMetrics = _.map(filteredMetrics, _.compose(_.partial(addMQEAlias, m.alias), wrapMetric));
                      }
                    } else {
                      filteredMetrics = _.map(filteredMetrics, wrapMetric);
                    }

                    metrics = metrics.concat(filteredMetrics);
                  } else {
                    metric = wrapMetric(metric);

                    // Add alias
                    if (m.alias) {
                      metric = addMQEAlias(m.alias, metric);
                    }

                    metrics = metrics.concat(metric);
                  }
                }
              }
            } catch (err) {
              _didIteratorError = true;
              _iteratorError = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }
              } finally {
                if (_didIteratorError) {
                  throw _iteratorError;
                }
              }
            }

            metrics = _.uniq(metrics);

            return _.map(metrics, function (metric) {
              var query = "";

              // Set custom metric format function
              var formatValueOriginal = _this.templateSrv.formatValue;
              _this.templateSrv.formatValue = formatMQEMetric;
              metric = _this.templateSrv.replace(metric, _this.scopedVars);

              // Set original format function
              _this.templateSrv.formatValue = formatValueOriginal;

              query += metric;

              // Render functions if any
              if (target.functions && target.functions.length) {
                query += _this.addFunctions(target.functions);
              }

              // Render apps and hosts
              query += _this.renderWhere(target.apps, target.hosts);

              query = MQEQuery.addTimeRange(query, timeFrom, timeTo);
              return query;
            });
          }
        }, {
          key: "addFunctions",
          value: function addFunctions(functions) {
            var query = "";
            if (functions.length) {
              _.forEach(functions, function (fn) {
                query += "|" + fn + " ";
              });
            }
            return query;
          }
        }, {
          key: "renderWhere",
          value: function renderWhere(apps, hosts) {
            var query = "";
            if (apps.length || hosts.length) {
              query += " where ";
              if (apps.length) {
                query += "cluster in (" + _.map(apps, wrapTag).join(', ') + ")";
                if (hosts.length) {
                  query += " and ";
                }
              }
              if (hosts.length) {
                query += "host in (" + _.map(hosts, wrapTag).join(', ') + ")";
              }
            }
            return query;
          }
        }, {
          key: "renderWhereClauses",
          value: function renderWhereClauses(whereClauses) {
            var _this2 = this;

            var renderedClauses = _.map(whereClauses, function (clauseObj, index) {
              var rendered = "";
              if (index !== 0) {
                rendered += clauseObj.condition + " ";
              }

              // Put non-numeric values into quotes.
              var value;
              if (_.isNumber(clauseObj.value) || _this2.containsVariable(clauseObj.value)) {
                value = clauseObj.value;
              } else {
                value = "'" + clauseObj.value + "'";
              }
              rendered += clauseObj.column + ' ' + clauseObj.operator + ' ' + value;
              return rendered;
            });
            return renderedClauses.join(' ');
          }
        }, {
          key: "containsVariable",
          value: function containsVariable(str) {
            var variables = _.map(this.templateSrv.variables, 'name');
            var self = this;
            return _.some(variables, function (variable) {
              return self.templateSrv.containsVariable(str, variable);
            });
          }
        }], [{
          key: "getMetrics",
          value: function getMetrics() {
            var query = "describe all";
            return query;
          }
        }, {
          key: "getColumns",
          value: function getColumns(metric) {
            return "describe " + metric;
          }
        }, {
          key: "addTimeRange",
          value: function addTimeRange(query, timeFrom, timeTo, interval) {
            var timeRangeRegex = /from.*to/;
            if (!timeRangeRegex.test(query)) {
              query = trim(query) + " from " + timeFrom + " to " + timeTo;
            }
            return query;
          }
        }]);

        return MQEQuery;
      }();

      _export("default", MQEQuery);
    }
  };
});
//# sourceMappingURL=query_builder.js.map
