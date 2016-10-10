'use strict';

System.register(['angular', 'lodash', 'app/plugins/sdk', './query_builder'], function (_export, _context) {
  "use strict";

  var angular, _, QueryCtrl, MQEQuery, _createClass, MQEQueryCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  return {
    setters: [function (_angular) {
      angular = _angular.default;
    }, function (_lodash) {
      _ = _lodash.default;
    }, function (_appPluginsSdk) {
      QueryCtrl = _appPluginsSdk.QueryCtrl;
    }, function (_query_builder) {
      MQEQuery = _query_builder.default;
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

      _export('MQEQueryCtrl', MQEQueryCtrl = function (_QueryCtrl) {
        _inherits(MQEQueryCtrl, _QueryCtrl);

        function MQEQueryCtrl($scope, $injector, $q, uiSegmentSrv, templateSrv) {
          _classCallCheck(this, MQEQueryCtrl);

          var _this = _possibleConstructorReturn(this, (MQEQueryCtrl.__proto__ || Object.getPrototypeOf(MQEQueryCtrl)).call(this, $scope, $injector));

          _this.scope = $scope;
          _this.$q = $q;
          _this.uiSegmentSrv = uiSegmentSrv;
          _this.templateSrv = templateSrv;

          var target_defaults = {
            rawQuery: "",
            metrics: [{ metric: "" }],
            functionList: [{ func: "" }],
            apps: [],
            hosts: [],
            addAppToAlias: true,
            addHostToAlias: true
          };
          _.defaults(_this.target, target_defaults);

          _this.appSegments = _.map(_this.target.apps, _this.uiSegmentSrv.newSegment);
          _this.hostSegments = _.map(_this.target.hosts, _this.uiSegmentSrv.newSegment);
          _this.removeSegment = uiSegmentSrv.newSegment({ fake: true, value: '-- remove --' });
          _this.fixSegments(_this.appSegments);
          _this.fixSegments(_this.hostSegments);

          // bs-typeahead can't work with async code so we need to
          // store metrics first.
          _this.availableMetrics = [];
          _this.updateMetrics();
          // Pass this to getMetrics() function, because it's called from bs-typeahead
          // without proper context.
          _this.getMetrics = _.bind(_this.getMetrics, _this);

          // operators
          _this.availableOperators = [];
          _this.updateOperators();

          // get operators here
          _this.getOperators = _.bind(_this.getOperators, _this);

          _this.availableFunctions = [];
          //this.availableTotalFunctionList = [];
          _this.udpateFunctions();

          //get functions here
          _this.getFunctions = _.bind(_this.getFunctions, _this);

          // Update panel when metric selected from dropdown
          $scope.$on('typeahead-updated', function () {
            _this.onChangeInternal();
          });
          return _this;
        }

        _createClass(MQEQueryCtrl, [{
          key: 'invokeMQEQuery',
          value: function invokeMQEQuery(query) {
            return this.datasource._mqe_query(query).then(function (result) {
              return result.body;
            });
          }
        }, {
          key: 'exploreMetrics',
          value: function exploreMetrics(query) {
            return this.datasource._mqe_explore(query);
          }
        }, {
          key: 'updateMetrics',
          value: function updateMetrics() {
            var self = this;
            this.exploreMetrics('metrics').then(function (metrics) {
              self.availableMetrics = metrics;
            });
          }
        }, {
          key: 'onChangeInternal',
          value: function onChangeInternal() {
            this.panelCtrl.refresh(); // Asks the panel to refresh data.
          }
        }, {
          key: 'toggleEditorMode',
          value: function toggleEditorMode() {
            this.target.rawQuery = !this.target.rawQuery;
          }
        }, {
          key: 'getCollapsedText',
          value: function getCollapsedText() {
            return this.target.rawQuery;
          }
        }, {
          key: 'appSegmentChanged',
          value: function appSegmentChanged(segment) {
            var _this2 = this;

            if (segment.type === 'plus-button') {
              segment.type = undefined;
            }
            this.target.apps = _.map(_.filter(this.appSegments, function (segment) {
              return segment.type !== 'plus-button' && segment.value !== _this2.removeSegment.value;
            }), 'value');
            this.appSegments = _.map(this.target.apps, this.uiSegmentSrv.newSegment);
            this.appSegments.push(this.uiSegmentSrv.newPlusButton());
            this.onChangeInternal();
          }
        }, {
          key: 'hostSegmentChanged',
          value: function hostSegmentChanged(segment) {
            var _this3 = this;

            if (segment.type === 'plus-button') {
              segment.type = undefined;
            }
            this.target.hosts = _.map(_.filter(this.hostSegments, function (segment) {
              return segment.type !== 'plus-button' && segment.value !== _this3.removeSegment.value;
            }), 'value');
            this.hostSegments = _.map(this.target.hosts, this.uiSegmentSrv.newSegment);
            this.hostSegments.push(this.uiSegmentSrv.newPlusButton());
            this.onChangeInternal();
          }
        }, {
          key: 'checkMetrics',
          value: function checkMetrics(selectedMetric) {
            if (selectedMetric.search(/[*!]/) !== -1 || _.contains(this.availableMetrics, selectedMetric) === true) {
              this.onChangeInternal();
            }
          }
        }, {
          key: 'addMetric',
          value: function addMetric() {
            this.target.metrics.push({ metric: "" });
            this.onChangeInternal();
          }
        }, {
          key: 'addFunction',
          value: function addFunction() {
            this.target.functionList.push({ func: "" });
            this.onChangeInternal();
          }
        }, {
          key: 'addJoinMetric',
          value: function addJoinMetric(index) {
            if (this.target.metrics[index].joins === undefined) {
              this.target.metrics[index]["joins"] = [{ joinOP: "", joinMetric: "" }];
            } else {
              this.target.metrics[index]['joins'].push({ joinOP: "", joinMetric: "" });
            }
            this.onChangeInternal();
          }
        }, {
          key: 'removeJoinMetric',
          value: function removeJoinMetric(index) {
            this.target.metrics[index].joins.splice(this.target.metrics[index].joins.length - 1, 1);
            this.onChangeInternal();
          }
        }, {
          key: 'removeMetric',
          value: function removeMetric(index) {
            this.target.metrics.splice(index, 1);
            this.onChangeInternal();
          }
        }, {
          key: 'removeFunction',
          value: function removeFunction() {
            this.target.functionList.splice(this.target.functionList.length - 1, 1);
            this.onChangeInternal();
          }
        }, {
          key: 'extractOpList',
          value: function extractOpList(functions) {
            var functionList = functions;
            var operatorRegex = /[\+\-\*\/~`\!@#$%\^&()|><\?]/;
            return _.filter(functionList, function (fn) {
              return fn.search(operatorRegex) !== -1;
            });
          }
        }, {
          key: 'updateOperators',
          value: function updateOperators() {
            var _this4 = this;

            var self = this;
            var opList;

            return this.exploreMetrics('functions').then(function (functions) {
              opList = _this4.extractOpList(functions);
              self.availableOperators = opList;
            });
          }
        }, {
          key: 'getMetrics',
          value: function getMetrics() {
            // Don't touch original metric list
            var metrics = _.clone(this.availableMetrics);
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = this.templateSrv.variables[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var variable = _step.value;

                metrics.unshift('$' + variable.name);
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

            return metrics;
          }
        }, {
          key: 'getOperators',
          value: function getOperators() {
            //if(this.availableOperators.length === 0) {
            //  var functions = this.availableTotalFunctionList;
            //  this.availableOperators = this.extractOpList(functions);
            //}
            var operatorList = _.clone(this.availableOperators);
            return operatorList;
          }
        }, {
          key: 'getFunctions',
          value: function getFunctions() {
            var fns = _.clone(this.availableFunctions);
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
              for (var _iterator2 = this.templateSrv.variables[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var variable = _step2.value;

                fns.unshift('$' + variable.name);
              }
            } catch (err) {
              _didIteratorError2 = true;
              _iteratorError2 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                  _iterator2.return();
                }
              } finally {
                if (_didIteratorError2) {
                  throw _iteratorError2;
                }
              }
            }

            return fns;
          }
        }, {
          key: 'describeMetric',
          value: function describeMetric(metric) {
            var describeQuery = MQEQuery.getColumns(metric);
            return this.invokeMQEQuery(describeQuery);
          }
        }, {
          key: 'getApps',
          value: function getApps() {
            var _this5 = this;

            return this.exploreMetrics('cluster').then(function (apps) {
              var segments = _this5.transformToSegments(apps, true);
              segments.splice(0, 0, angular.copy(_this5.removeSegment));
              return segments;
            });
          }
        }, {
          key: 'getHosts',
          value: function getHosts() {
            var _this6 = this;

            return this.exploreMetrics('hosts').then(function (hosts) {
              var segments = _this6.transformToSegments(hosts, true);
              segments.splice(0, 0, angular.copy(_this6.removeSegment));
              return segments;
            });
          }
        }, {
          key: 'refineFunctionList',
          value: function refineFunctionList(functions) {
            var functionList = [];
            functionList.push(functions);
            var operatorlist = ['*', '+', '-', '/'];
            _.forEach(operatorlist, function (item) {
              var index = functionList.indexOf(item);
              if (index > -1) {
                functionList.splice(index, 1);
              }
            });
            return functionList;
          }
        }, {
          key: 'udpateFunctions',
          value: function udpateFunctions() {
            var _this7 = this;

            var self = this;
            var functionList;

            return this.exploreMetrics('functions').then(function (functions) {
              // remove operators like *+-/ from the function list
              //self.availableTotalFunctionList = functions;
              functionList = _this7.refineFunctionList(functions);
              self.availableFunctions = functionList;
            });
          }
        }, {
          key: 'transformToSegments',
          value: function transformToSegments(results, addTemplateVars) {
            var _this8 = this;

            var segments = _.map(_.flatten(results), function (value) {
              return _this8.uiSegmentSrv.newSegment({
                value: value.toString(),
                expandable: false
              });
            });

            if (addTemplateVars) {
              var _iteratorNormalCompletion3 = true;
              var _didIteratorError3 = false;
              var _iteratorError3 = undefined;

              try {
                for (var _iterator3 = this.templateSrv.variables[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                  var variable = _step3.value;

                  segments.unshift(this.uiSegmentSrv.newSegment({ type: 'template', value: '$' + variable.name, expandable: true }));
                }
              } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion3 && _iterator3.return) {
                    _iterator3.return();
                  }
                } finally {
                  if (_didIteratorError3) {
                    throw _iteratorError3;
                  }
                }
              }
            }
            return segments;
          }
        }, {
          key: 'fixSegments',
          value: function fixSegments(segments) {
            var count = segments.length;
            var lastSegment = segments[Math.max(count - 1, 0)];

            if (!lastSegment || lastSegment.type !== 'plus-button') {
              segments.push(this.uiSegmentSrv.newPlusButton());
            }
          }
        }]);

        return MQEQueryCtrl;
      }(QueryCtrl));

      _export('MQEQueryCtrl', MQEQueryCtrl);

      MQEQueryCtrl.templateUrl = 'partials/query.editor.html';
    }
  };
});
//# sourceMappingURL=query_ctrl.js.map
