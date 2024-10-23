# Library array
LIBS = ccc-auth ccc-ui

# Pattern rules
pack-%:
	cd dist/$* && npm pack

install-%:
	npm i && cd projects/$* && npm install

ci-%:
	cd projects/$* && npm ci

lint-%:
	cd projects/$* && ng lint

build-%:
	ng build $*

# Composite targets
pack: $(addprefix pack-,$(LIBS))

install: $(addprefix install-,$(LIBS))

ci: $(addprefix ci-,$(LIBS))

build: $(addprefix build-,$(LIBS))

lint: $(addprefix lint-,$(LIBS))
