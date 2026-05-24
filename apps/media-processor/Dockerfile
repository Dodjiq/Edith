# syntax=docker/dockerfile:1

# Builder stage - compiles the Rust binary (matches aws-sdk minimum 1.88)
FROM rust:1.88-bookworm AS builder
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends pkg-config libssl-dev ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY Cargo.toml Cargo.lock ./
COPY src ./src

RUN cargo build --release --locked

# Runtime stage - slim image with ffmpeg available
FROM debian:bookworm-slim AS runtime
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --uid 10001 media

COPY --from=builder /app/target/release/media-processor /usr/local/bin/media-processor

ENV PORT=4005
ENV RUST_LOG=info

EXPOSE 4005
USER media
CMD ["media-processor"]
