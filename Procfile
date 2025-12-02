server: cd cmd && air -c .air.toml
spanner: cd cmd && docker run --rm -p ${SPANNER_EMULATOR_PORT}:9010 gcr.io/cloud-spanner-emulator/emulator:1.5.43 2>&1 | grep -v "memory.cc:"
bootstrap-spanner: cd cmd && bash -c 'for i in {1..300}; do (echo > /dev/tcp/localhost/${SPANNER_EMULATOR_PORT}) >/dev/null 2>&1 && sleep 1 && break || sleep 0.1; done;' && go run --tags=collect_resource_permissions cmd/bootstrap/main.go
ui: ng serve --port=${APP_NG_SERVE_PORT} --no-hmr