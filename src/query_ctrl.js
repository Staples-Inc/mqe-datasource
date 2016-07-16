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

    var target_defaults = {
      rawQuery: ""
    };
    _.defaults(this.target, target_defaults);
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

  ///////////////////////
  // Query suggestions //
  ///////////////////////

  getMetrics() {
    var schema = this.schemaSegment.value;
    var self = this;
    return this.invokeMQEQuery(MQEQuery.getMetrics(schema))
      .then(rows => {
        return self.transformToSegments(rows);
      });
  }

  transformToSegments(results) {
    var segments = _.map(_.flatten(results), value => {
      return this.uiSegmentSrv.newSegment({
        value: value.toString(),
        expandable: false
      });
    });
    return segments;
  }

}

MQEQueryCtrl.templateUrl = 'partials/query.editor.html';
