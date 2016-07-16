# mqe-datasource

Experimental prototype MQE (Metrics Query Engine) data source plugin for Grafana 3.x.
* NOT FOR PRODUCTION USE *

## Building from sources
You need nodejs and grunt-cli to build plugin from sources.
First time run `npm install` to load required dependencies. Then run `grunt` to build project.
```sh
git pull https://github.com/raintank/mqe-datasource.git
cd mqe-datasource
npm install
grunt
```

When you update project, run grunt to rebuild.
```sh
git pull
grunt
```