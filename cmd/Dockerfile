# To ensure stable deployment and prevent automatic updates, it's crucial to reference  all
# images by their digest. This approach locks the image to a specific version, allowing 
# reproducible builds, and also ensures future security scans will target the deployed image.
#
# Finding the digest of an image can be done by pulling the image and inspecting it.

# > docker pull cgr.dev/chainguard/go:latest
# > docker inspect cgr.dev/chainguard/go:latest --format='{{index .RepoDigests 0}}'
FROM cgr.dev/chainguard/go@sha256:0edc57c11262ef29f7da3b132becfe811cf44502c010872804d8fe293ab8ba4c as build-env

WORKDIR /go/src/app

COPY . ./

ARG BUILD_TAGS=""
RUN CGO_ENABLED=0 go build -tags "$BUILD_TAGS" -ldflags '-extldflags "-static"' -o /build/app

# > docker pull node:20
# > docker inspect node:20 --format='{{index .RepoDigests 0}}'
FROM docker.io/library/node@sha256:572a90df10a58ebb7d3f223d661d964a6c2383a9c2b5763162b4f631c53dc56a as client-build-env
ARG VALIDATE_LICENSE=false
ARG TELERIK_LICENSE=''
ARG APP_DEPLOYMENT
ARG APP_COMMIT_ID=''
ARG APP_VERSION=''
ARG APP_SESSION_DURATION
ARG APP_PWA_NAME
ARG APP_PWA_SHORT_NAME
WORKDIR /src/app
COPY ./gui ./
RUN mkdir -p /homebuild/gui && \
    npm ci && \
    if [ "$VALIDATE_LICENSE" = "true" ]; then \
      echo "✅ Activating Kendo UI license..." && \
      npx kendo-ui-license activate; \
    else \
      echo "Skipping license activation."; \
    fi && \
    npm run build && \
    mv dist /homebuild/gui/

# > docker pull cgr.dev/chainguard/static:latest-glibc
# > docker inspect cgr.dev/chainguard/static:latest-glibc --format='{{index .RepoDigests 0}}'
FROM cgr.dev/chainguard/static@sha256:6a4b683f4708f1f167ba218e31fcac0b7515d94c33c3acf223c36d5c6acd3783
COPY --from=build-env /build /
COPY --from=client-build-env /homebuild/gui /home/nonroot/gui
WORKDIR /home/nonroot
USER nonroot

ENTRYPOINT ["/app"]