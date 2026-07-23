IMAGE    := ghcr.io/defkiehaust/acms
COMPOSE  := docker compose -f deploy/compose.yml

GIT_TAG  := $(shell git describe --tags --exact-match 2>/dev/null || echo "")
GIT_HASH := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")

BUILD_TAG := $(or $(GIT_TAG),$(GIT_HASH))

.PHONY: build up down stop rebuild publish

build:
	docker build -t $(IMAGE):$(BUILD_TAG) .
	@echo "==> Built $(IMAGE):$(BUILD_TAG)"

up:
	$(COMPOSE) up -d

down stop:
	$(COMPOSE) down

rebuild: build up

publish:
	@if [ -z "$(GIT_TAG)" ]; then \
		echo "ERROR: No git tag found on HEAD. Tag the commit first:"; \
		echo "  git tag vX.Y.Z"; \
		exit 1; \
	fi
	docker build -t $(IMAGE):$(GIT_TAG) -t $(IMAGE):latest .
	docker push $(IMAGE):$(GIT_TAG)
	docker push $(IMAGE):latest
	@echo "==> Published $(IMAGE):$(GIT_TAG) and :latest"
