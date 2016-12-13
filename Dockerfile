FROM grafana/grafana:master
ADD dist /var/lib/grafana/plugins/.
