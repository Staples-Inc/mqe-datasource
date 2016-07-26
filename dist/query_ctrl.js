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

          var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(MQEQueryCtrl).call(this, $scope, $injector));

          _this.scope = $scope;
          _this.$q = $q;
          _this.uiSegmentSrv = uiSegmentSrv;
          _this.templateSrv = templateSrv;

          var target_defaults = {
            rawQuery: "",
            apps: [],
            hosts: []
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
          value: function appSegmentChanged(segment, index) {
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
          value: function hostSegmentChanged(segment, index) {
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
          key: 'describeMetric',
          value: function describeMetric(metric) {
            var describeQuery = MQEQuery.getColumns(metric);
            return this.invokeMQEQuery(describeQuery);
          }
        }, {
          key: 'getApps',
          value: function getApps() {
            var _this4 = this;

            return this.exploreMetrics('apps').then(function (apps) {
              var segments = _this4.transformToSegments(apps, true);
              segments.splice(0, 0, angular.copy(_this4.removeSegment));
              return segments;
            });
          }
        }, {
          key: 'getHosts',
          value: function getHosts() {
            var _this5 = this;

            return this.exploreMetrics('hosts').then(function (hosts) {
              var segments = _this5.transformToSegments(hosts, true);
              segments.splice(0, 0, angular.copy(_this5.removeSegment));
              return segments;
            });
          }
        }, {
          key: 'transformToSegments',
          value: function transformToSegments(results, addTemplateVars) {
            var _this6 = this;

            var segments = _.map(_.flatten(results), function (value) {
              return _this6.uiSegmentSrv.newSegment({
                value: value.toString(),
                expandable: false
              });
            });

            if (addTemplateVars) {
              var _iteratorNormalCompletion2 = true;
              var _didIteratorError2 = false;
              var _iteratorError2 = undefined;

              try {
                for (var _iterator2 = this.templateSrv.variables[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                  var variable = _step2.value;

                  segments.unshift(this.uiSegmentSrv.newSegment({ type: 'template', value: '$' + variable.name, expandable: true }));
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
