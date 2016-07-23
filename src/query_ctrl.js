import angular from 'angular';
import _ from 'lodash';
import {QueryCtrl} from 'app/plugins/sdk';
import MQEQuery from './query_builder';

export class MQEQueryCtrl extends QueryCtrl {

  constructor($scope, $injector, $q, uiSegmentSrv, templateSrv)  {
    super($scope, $injector);

    this.scope = $scope;
    this.$q = $q;
    this.uiSegmentSrv = uiSegmentSrv;
    this.templateSrv = templateSrv;

    this.operators = ['=', '!=', 'in', 'match'];
    this.whereSegments = [];

    var target_defaults = {
      rawQuery: "",
      whereClauses: []
    };
    _.defaults(this.target, target_defaults);

    this.buildWhereSegments(this.target.whereClauses);
    this.removeWhereSegment = uiSegmentSrv.newSegment({fake: true, value: '-- remove --'});

    // bs-typeahead can't work with async code so we need to
    // store metrics first.
    this.availableMetrics = [];
    this.updateMetrics();
  }

  invokeMQEQuery(query) {
    return this.datasource._mqe_query(query).then(result => {
      return result.body;
    });
  }

  exploreMetrics() {
    return this.datasource._mqe_explore().then(result => {
      return result.metrics;
    });
  }

  updateMetrics() {
    var self = this;
    this.exploreMetrics().then(metrics => {
      self.availableMetrics = metrics;
    });
  }

  // Event handlers

  onChangeInternal() {
    this.panelCtrl.refresh(); // Asks the panel to refresh data.
  }

  toggleEditorMode() {
    this.target.rawQuery = !this.target.rawQuery;
  }

  getCollapsedText() {
    return this.target.rawQuery;
  }

  whereSegmentUpdated(segment, index) {
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
      if ((index + 1) === this.whereSegments.length) {
        this.whereSegments.push(this.uiSegmentSrv.newPlusButton());
      }
    }

    this.buildWhereClauses();

    // Refresh only if all fields setted
    if (_.every(this.whereSegments, segment => {
      return ((segment.value || segment.type === 'plus-button') &&
              !(segment.fake && segment.type !== 'plus-button'));
    })) {
      this.panelCtrl.refresh();
    }
  }

  ///////////////////////
  // Query suggestions //
  ///////////////////////

  describeMetric(metric) {
    var describeQuery = MQEQuery.getColumns(metric);
    return this.invokeMQEQuery(describeQuery);
  }

  getColumns(metric) {
    var self = this;
    return this.describeMetric(metric).then(result => {
      return self.transformToSegments(_.keys(result), true);
    });
  }

  getValues(metric, column) {
    var self = this;
    return this.describeMetric(metric).then(result => {
      return self.transformToSegments(result[column], true);
    });
  }

  getColumnsOrValues(segment, index) {
    var metric = this.templateSrv.replace(this.target.metric);
    var self = this;
    if (segment.type === 'condition') {
      return this.$q.when([
        this.uiSegmentSrv.newSegment('AND'),
        this.uiSegmentSrv.newSegment('OR')
      ]);
    }
    if (segment.type === 'operator') {
      return this.$q.when(this.uiSegmentSrv.newOperators(this.operators));
    }

    if (segment.type === 'key' || segment.type === 'plus-button') {
      return this.getColumns(metric).then(columns => {
        columns.splice(0, 0, angular.copy(self.removeWhereSegment));
        return columns;
      });
    } else if (segment.type === 'value') {
      return this.getValues(metric, this.whereSegments[index - 2].value);
    }
  }

  ///////////////////////

  buildWhereSegments(whereClauses) {
    var self = this;
    _.forEach(whereClauses, whereClause => {
      if (whereClause.condition) {
        self.whereSegments.push(self.uiSegmentSrv.newCondition(whereClause.condition));
      }
      self.whereSegments.push(self.uiSegmentSrv.newKey(whereClause.column));
      self.whereSegments.push(self.uiSegmentSrv.newOperator(whereClause.operator));
      self.whereSegments.push(self.uiSegmentSrv.newKeyValue(whereClause.value));
    });
    this.fixSegments(this.whereSegments);
  }

  buildWhereClauses() {
    var i = 0;
    var whereIndex = 0;
    var segments = this.whereSegments;
    var whereClauses = [];
    while (segments.length > i && segments[i].type !== 'plus-button') {
      if (whereClauses.length < whereIndex + 1) {
        whereClauses.push({condition: '', column: '', operator: '', value: ''});
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

  transformToSegments(results, addTemplateVars) {
    var segments = _.map(_.flatten(results), value => {
      return this.uiSegmentSrv.newSegment({
        value: value.toString(),
        expandable: false
      });
    });

    if (addTemplateVars) {
      for (let variable of this.templateSrv.variables) {
        segments.unshift(this.uiSegmentSrv.newSegment({ type: 'template', value: '$' + variable.name, expandable: true }));
      }
    }
    return segments;
  }

  fixSegments(segments) {
    var count = segments.length;
    var lastSegment = segments[Math.max(count-1, 0)];

    if (!lastSegment || lastSegment.type !== 'plus-button') {
      segments.push(this.uiSegmentSrv.newPlusButton());
    }
  }

}

MQEQueryCtrl.templateUrl = 'partials/query.editor.html';
