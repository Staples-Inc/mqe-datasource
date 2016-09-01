'use strict';

System.register(['lodash', 'app/core/utils/datemath', 'moment', './query_builder', './response_handler'], function (_export, _context) {
  "use strict";

  var _, dateMath, moment, MQEQuery, response_handler, _createClass, MQEDatasource;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  // Special value formatter for MQE.
  // Render multi-value variables for using in "IN" expression:
  // $host => ('backend01', 'backend02')
  // where host in $host => where host in ('backend01', 'backend02')
  function formatMQEValue(value, format, variable) {
    if (typeof value === 'string') {
      return value;
    }
    if (variable.query == 'metrics') {
      return value.join("`, `");
    } else {
      return value.join("', '");
    }
  }

  function parseInterval(interval) {
    var intervalPattern = /(^[\d]+)(y|M|w|d|h|m|s)/g;
    var momentInterval = intervalPattern.exec(interval);
    return moment.duration(Number(momentInterval[1]), momentInterval[2]).valueOf();
  }
  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_appCoreUtilsDatemath) {
      dateMath = _appCoreUtilsDatemath;
    }, function (_moment) {
      moment = _moment.default;
    }, function (_query_builder) {
      MQEQuery = _query_builder.default;
    }, function (_response_handler) {
      response_handler = _response_handler;
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

      _export('MQEDatasource', MQEDatasource = function () {
        function MQEDatasource(instanceSettings, $q, backendSrv, templateSrv) {
          _classCallCheck(this, MQEDatasource);

          this.type = instanceSettings.type;
          this.url = instanceSettings.url;
          this.name = instanceSettings.name;
          this.$q = $q;
          this.backendSrv = backendSrv;
          this.templateSrv = templateSrv;
          this.templateSrv.formatValue = formatMQEValue;

          // Default is 10 minutes
          var cacheTTL = instanceSettings.jsonData.cacheTTL || '10m';
          this.cacheTTL = parseInterval(cacheTTL);
          this.cache = {};
        }

        // Called once per panel (graph)


        _createClass(MQEDatasource, [{
          key: 'query',
          value: function query(options) {
            var _this = this;

            var timeFrom = Math.ceil(dateMath.parse(options.range.from));
            var timeTo = Math.ceil(dateMath.parse(options.range.to));
            var mqeQuery, mqeQueryPromise;
            var self = this;

            var queries = _.map(options.targets, function (target) {
              if (target.hide || target.rawQuery && !target.query) {
                return [];
              } else {
                if (target.rawQuery) {
                  // Use raw query
                  mqeQuery = MQEQuery.addTimeRange(target.query, timeFrom, timeTo);

                  // Return query in async manner
                  mqeQueryPromise = _this.$q.when([mqeQuery]);
                } else {

                  // Build query
                  var queryModel = new MQEQuery(target, _this.templateSrv, options.scopedVars);
                  mqeQueryPromise = _this._mqe_explore('metrics').then(function (metrics) {
                    return queryModel.render(metrics, timeFrom, timeTo, options.interval);
                  });
                }

                return mqeQueryPromise.then(function (mqeQueries) {
                  var queryPromises = _.map(mqeQueries, function (mqeQuery) {
                    mqeQuery = self.templateSrv.replace(mqeQuery, options.scopedVars);

                    return self._mqe_query(mqeQuery).then(function (response) {
                      return response_handler.handle_response(target, response);
                    });
                  });
                  return self.$q.all(queryPromises);
                });
              }
            });
            return this.$q.all(_.flatten(queries)).then(function (result) {
              return {
                data: _.flatten(result)
              };
            });
          }
        }, {
          key: 'testDatasource',
          value: function testDatasource() {
            return this.backendSrv.datasourceRequest({
              url: this.url + '/',
              method: 'GET'
            }).then(function (response) {
              if (response.status === 200) {
                return {
                  status: "success",
                  message: "Connected to MQE",
                  title: "Success"
                };
              }
            });
          }
        }, {
          key: 'metricFindQuery',
          value: function metricFindQuery(query) {
            if (!query) {
              return this.$q.when([]);
            }

            query = this.templateSrv.replace(query);
            return this._mqe_explore(query).then(function (result) {
              return _.map(result, function (metric) {
                return {
                  text: metric,
                  value: metric
                };
              });
            });
          }
        }, {
          key: '_mqe_explore',
          value: function _mqe_explore(query) {
            var _this2 = this;

            var tokenRequest = void 0;

            if (!this.cache.token || Date.now() - this.cache.token.timestamp > this.cacheTTL) {

              tokenRequest = this._get('/token/').then(function (response) {
                _this2.cache.token = {
                  timestamp: Date.now(),
                  value: response.data
                };
                return response.data;
              });
            } else {
              tokenRequest = this.$q.when(this.cache.token.value);
            }

            return tokenRequest.then(function (result) {
              return response_handler.handle_explore_response(query, result);
            });
          }
        }, {
          key: '_mqe_query',
          value: function _mqe_query(query) {
            var mqe_query = {
              query: query
            };
            return this._post('/query/', mqe_query).then(function (response) {
              return response.data;
            });
          }
        }, {
          key: '_get',
          value: function _get(url) {
            return this.backendSrv.datasourceRequest({
              url: this.url + url,
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            });
          }
        }, {
          key: '_post',
          value: function _post(url, data) {
            return this.backendSrv.datasourceRequest({
              url: this.url + url,
              data: data,
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              }
            });
          }
        }]);

        return MQEDatasource;
      }());

      _export('MQEDatasource', MQEDatasource);
    }
  };
});
//# sourceMappingURL=datasource.js.map
