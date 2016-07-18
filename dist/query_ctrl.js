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

          _this.operators = ['=', '!=', 'in', 'match'];
          _this.whereSegments = [];

          var target_defaults = {
            rawQuery: "",
            whereClauses: []
          };
          _.defaults(_this.target, target_defaults);

          _this.buildWhereSegments(_this.target.whereClauses);
          _this.removeWhereSegment = uiSegmentSrv.newSegment({ fake: true, value: '-- remove --' });

          // bs-typeahead can't work with async code so we need to
          // store metrics first.
          _this.availableMetrics = [];
          _this.updateMetrics();
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
          key: 'updateMetrics',
          value: function updateMetrics() {
            var self = this;
            this.invokeMQEQuery(MQEQuery.getMetrics()).then(function (metrics) {
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
          key: 'whereSegmentUpdated',
          value: function whereSegmentUpdated(segment, index) {
            this.whereSegments[index] = segment;

            if (segment.value === this.removeWhereSegment.value) {
              this.whereSegments.splice(index, 3);
              if (this.whereSegments.length === 0) {
                this.whereSegments.push(this.uiSegmentSrv.newPlusButton());
              } else if (this.whereSegments.length > 2) {
                this.whereSegments.splice(Math.max(index - 1, 0), 1);
                if (this.whereSegments[this.whereSegments.length - 1].type !== 'plus-button') {
                  this.whereSegments.push(this.uiSegmentSrv.newPlusButton());
                }
              }
            } else {
              if (segment.type === 'plus-button') {
                if (index > 2) {
                  this.whereSegments.splice(index, 0, this.uiSegmentSrv.newCondition('AND'));
                }
                this.whereSegments.push(this.uiSegmentSrv.newOperator('='));
                this.whereSegments.push(this.uiSegmentSrv.newFake('select tag value', 'value', 'query-segment-value'));
                segment.type = 'key';
                segment.cssClass = 'query-segment-key';
              }
              if (index + 1 === this.whereSegments.length) {
                this.whereSegments.push(this.uiSegmentSrv.newPlusButton());
              }
            }

            this.buildWhereClauses();

            // Refresh only if all fields setted
            if (_.every(this.whereSegments, function (segment) {
              return (segment.value || segment.type === 'plus-button') && !(segment.fake && segment.type !== 'plus-button');
            })) {
              this.panelCtrl.refresh();
            }
          }
        }, {
          key: 'describeMetric',
          value: function describeMetric(metric) {
            var describeQuery = MQEQuery.getColumns(metric);
            return this.invokeMQEQuery(describeQuery);
          }
        }, {
          key: 'getColumns',
          value: function getColumns(metric) {
            var self = this;
            return this.describeMetric(metric).then(function (result) {
              return self.transformToSegments(_.keys(result), true);
            });
          }
        }, {
          key: 'getValues',
          value: function getValues(metric, column) {
            var self = this;
            return this.describeMetric(metric).then(function (result) {
              return self.transformToSegments(result[column], true);
            });
          }
        }, {
          key: 'getColumnsOrValues',
          value: function getColumnsOrValues(segment, index) {
            var metric = this.target.metric;
            var self = this;
            if (segment.type === 'condition') {
              return this.$q.when([this.uiSegmentSrv.newSegment('AND'), this.uiSegmentSrv.newSegment('OR')]);
            }
            if (segment.type === 'operator') {
              return this.$q.when(this.uiSegmentSrv.newOperators(this.operators));
            }

            if (segment.type === 'key' || segment.type === 'plus-button') {
              return this.getColumns(metric).then(function (columns) {
                columns.splice(0, 0, angular.copy(self.removeWhereSegment));
                return columns;
              });
            } else if (segment.type === 'value') {
              return this.getValues(metric, this.whereSegments[index - 2].value);
            }
          }
        }, {
          key: 'buildWhereSegments',
          value: function buildWhereSegments(whereClauses) {
            var self = this;
            _.forEach(whereClauses, function (whereClause) {
              if (whereClause.condition) {
                self.whereSegments.push(self.uiSegmentSrv.newCondition(whereClause.condition));
              }
              self.whereSegments.push(self.uiSegmentSrv.newKey(whereClause.column));
              self.whereSegments.push(self.uiSegmentSrv.newOperator(whereClause.operator));
              self.whereSegments.push(self.uiSegmentSrv.newKeyValue(whereClause.value));
            });
            this.fixSegments(this.whereSegments);
          }
        }, {
          key: 'buildWhereClauses',
          value: function buildWhereClauses() {
            var i = 0;
            var whereIndex = 0;
            var segments = this.whereSegments;
            var whereClauses = [];
            while (segments.length > i && segments[i].type !== 'plus-button') {
              if (whereClauses.length < whereIndex + 1) {
                whereClauses.push({ condition: '', column: '', operator: '', value: '' });
              }
              if (segments[i].type === 'condition') {
                whereClauses[whereIndex].condition = segments[i].value;
              } else if (segments[i].type === 'key') {
                whereClauses[whereIndex].column = segments[i].value;
              } else if (segments[i].type === 'operator') {
                whereClauses[whereIndex].operator = segments[i].value;
              } else if (segments[i].type === 'value') {
                whereClauses[whereIndex].value = segments[i].value;
                whereIndex++;
              }
              i++;
            }
            this.target.whereClauses = whereClauses;
          }
        }, {
          key: 'transformToSegments',
          value: function transformToSegments(results, addTemplateVars) {
            var _this2 = this;

            var segments = _.map(_.flatten(results), function (value) {
              return _this2.uiSegmentSrv.newSegment({
                value: value.toString(),
                expandable: false
              });
            });

            if (addTemplateVars) {
              var _iteratorNormalCompletion = true;
              var _didIteratorError = false;
              var _iteratorError = undefined;

              try {
                for (var _iterator = this.templateSrv.variables[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                  var variable = _step.value;

                  segments.unshift(this.uiSegmentSrv.newSegment({ type: 'template', value: '$' + variable.name, expandable: true }));
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
