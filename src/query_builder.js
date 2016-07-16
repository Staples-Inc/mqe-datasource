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

  render(timeFrom, timeTo, interval) {
    // pass
  }

  ////////////////////
  // Static methods //
  ////////////////////

  static getMetrics() {
    var query = "describe all";
    return query;
  }
}
