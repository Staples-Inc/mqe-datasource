import MQEQuery from '../query_builder';

describe('MQEQuery', function() {
  var ctx = {};
  var metricList = [
    'os.cpu.all.user_percentage',
    'os.cpu.all.system_percentage',
    'os.cpu.all.active_percentage',
    'os.disk.sda.io_time',
    'os.disk.sdb.io_time',
    'os.disk.sdc.io_time'
  ];
  var target_template = {
    metrics: [
      {metric: 'os.cpu.all.user_percentage'}
    ],
    alias: '',
    apps: [],
    hosts: []
  };

  describe('When render query', function() {
    beforeEach(function() {
      ctx.templateSrv = {};
      ctx.scopedVars = {};

      ctx.timeFrom = '1464130140000';
      ctx.timeTo = '1464130150000';
      ctx.interval = '10s';

      ctx.target = target_template;
      ctx.query = new MQEQuery(ctx.target, ctx.templateSrv, ctx.scopedVars);
    });

    it('should render proper MQE query', function(done) {
      var expected_query = [
        "os.cpu.all.user_percentage from 1464130140000 to 1464130150000"
      ];
      var result = ctx.query.render(metricList, ctx.timeFrom, ctx.timeTo, ctx.interval);
      expect(result).to.deep.equal(expected_query);
      done();
    });

    it('should render proper MQE query when wildcard used', function(done) {
      var target = {
        metrics: [
          {metric: "os.cpu.all.*"}
        ],
        apps: [],
        hosts: []
      };
      ctx.query = new MQEQuery(target, ctx.templateSrv, ctx.scopedVars);

      var expected_query = [
        "os.cpu.all.user_percentage from 1464130140000 to 1464130150000",
        "os.cpu.all.system_percentage from 1464130140000 to 1464130150000",
        "os.cpu.all.active_percentage from 1464130140000 to 1464130150000",
      ];

      var result = ctx.query.render(metricList, ctx.timeFrom, ctx.timeTo, ctx.interval);
      expect(result).to.deep.equal(expected_query);
      done();
    });

  });
});