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

    var target_defaults = {
      rawQuery: "",
      metrics: [{ metric: ""}],
      functionList:[{ func: ""}],
      apps: [],
      hosts: [],
      addAppToAlias: true,
      addHostToAlias: true
    };
    _.defaults(this.target, target_defaults);

    this.appSegments = _.map(this.target.apps, this.uiSegmentSrv.newSegment);
    this.hostSegments = _.map(this.target.hosts, this.uiSegmentSrv.newSegment);
    this.removeSegment = uiSegmentSrv.newSegment({fake: true, value: '-- remove --'});
    this.fixSegments(this.appSegments);
    this.fixSegments(this.hostSegments);

    // bs-typeahead can't work with async code so we need to
    // store metrics first.
    this.availableMetrics = [];
    this.updateMetrics();
    // Pass this to getMetrics() function, because it's called from bs-typeahead
    // without proper context.
    this.getMetrics = _.bind(this.getMetrics, this);

    // operators
    this.availableOperators = [];
    this.updateOperators();

    // get operators here
    this.getOperators = _.bind(this.getOperators, this);

    this.availableFunctions = [];
    this.udpateFunctions();

    //get functions here
    this.getFunctions = _.bind(this.getFunctions, this);

    // Update panel when metric selected from dropdown
    $scope.$on('typeahead-updated', () => {
      this.onChangeInternal();
    });
  }

  invokeMQEQuery(query) {
    return this.datasource._mqe_query(query).then(result => {
      return result.body;
    });
  }

  exploreMetrics(query) {
    return this.datasource._mqe_explore(query);
  }

  updateMetrics() {
    var self = this;
    this.exploreMetrics('metrics').then(metrics => {
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

  appSegmentChanged(segment) {
    if (segment.type === 'plus-button') {
      segment.type = undefined;
    }
    this.target.apps = _.map(_.filter(this.appSegments, segment => {
      return (segment.type !== 'plus-button' &&
              segment.value !== this.removeSegment.value);
    }), 'value');
    this.appSegments = _.map(this.target.apps, this.uiSegmentSrv.newSegment);
    this.appSegments.push(this.uiSegmentSrv.newPlusButton());
    this.onChangeInternal();
  }

  hostSegmentChanged(segment) {
    if (segment.type === 'plus-button') {
      segment.type = undefined;
    }
    this.target.hosts = _.map(_.filter(this.hostSegments, segment => {
      return (segment.type !== 'plus-button' &&
              segment.value !== this.removeSegment.value);
    }), 'value');
    this.hostSegments = _.map(this.target.hosts, this.uiSegmentSrv.newSegment);
    this.hostSegments.push(this.uiSegmentSrv.newPlusButton());
    this.onChangeInternal();
  }

  checkMetrics(selectedMetric) {
    if((selectedMetric.search(/[*!]/)) !== -1 || (_.contains(this.availableMetrics, selectedMetric) === true)) {
      this.onChangeInternal();
    }
  }

  addMetric() {
    this.target.metrics.push({metric: ""});
    this.onChangeInternal();
  }

  addFunction() {
    this.target.functionList.push({ func: "" });
    this.onChangeInternal();
  }

  addJoinMetric(index) {
    if (this.target.metrics[index].joins === undefined) {
      this.target.metrics[index]["joins"] = [{joinOP: "", joinMetric: ""}];
    }
    else {
      this.target.metrics[index]['joins'].push({joinOP:"", joinMetric:""});
    }
    this.onChangeInternal();
  }

  removeJoinMetric(index) {
    this.target.metrics[index].joins.splice(this.target.metrics[index].joins.length-1, 1);
    this.onChangeInternal();
  }

  removeMetric(index) {
    this.target.metrics.splice(index, 1);
    this.onChangeInternal();
  }

  removeFunction() {
    this.target.functionList.splice(this.target.functionList.length-1, 1);
    this.onChangeInternal();
  }

  extractOpList(functions) {
    var functionList = functions;
    var operatorRegex = /[\+\-\*\/~`\!@#$%\^&()|><\?]/;
    return _.filter(functionList, function (fn) {
      return fn.search(operatorRegex) !== -1;
    });
  }

  updateOperators() {
    var self = this;
    var opList;

    return this.exploreMetrics('functions').then(functions => {
      opList = this.extractOpList(functions);
      self.availableOperators = opList;
    });
  }
  ///////////////////////
  // Query suggestions //
  ///////////////////////

  getMetrics() {
    // Don't touch original metric list
    var metrics = _.clone(this.availableMetrics);
    for (let variable of this.templateSrv.variables) {
      metrics.unshift('$' + variable.name);
    }
    return metrics;
  }

  getOperators() {
    var operatorList = _.clone(this.availableOperators);
    return operatorList;
  }

  getFunctions() {
    var fns = _.clone(this.availableFunctions);
    for (let variable of this.templateSrv.variables) {
      fns.unshift('$' + variable.name);
    }
    return fns;
  }

  describeMetric(metric) {
    var describeQuery = MQEQuery.getColumns(metric);
    return this.invokeMQEQuery(describeQuery);
  }

  getApps() {
    return this.exploreMetrics('cluster').then(apps => {
      let segments = this.transformToSegments(apps, true);
      segments.splice(0, 0, angular.copy(this.removeSegment));
      return segments;
    });
  }

  getHosts() {
    return this.exploreMetrics('hosts').then(hosts => {
      let segments = this.transformToSegments(hosts, true);
      segments.splice(0, 0, angular.copy(this.removeSegment));
      return segments;
    });
  }

  refineFunctionList(functions) {
    var functionList = [];
    functionList.push(functions);
    var operatorlist = ['*','+','-','/'];
    _.forEach(operatorlist, function (item) {
      var index = functionList.indexOf(item);
      if (index > -1) {
        functionList.splice(index, 1);
      }
    });
    return functionList;

  }
  udpateFunctions() {
    var self = this;
    var functionList;

    return this.exploreMetrics('functions').then((functions) => {
      // remove operators like *+-/ from the function list
      functionList = this.refineFunctionList(functions);
      self.availableFunctions = functionList;
    });
  }
  ///////////////////////

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
